"use client";

import { useState } from "react";
import { ListBullets, Plus } from "@phosphor-icons/react";
import { BottomSheet, Button, DestructiveButton, EmptyState, Input, ListGroup, ListRow, useToast } from "@/components/ui";
import { PushedScreen } from "@/components/screens/Screen";

import { db, now, uuid } from "@/db";
import { formatINR } from "@/lib/format";
import { usePresets } from "@/db/queries";
import { paiseToInput, parseRupees } from "@/lib/money";
import type { Preset } from "@/types";

function PresetSheet({ preset, onClose, nextOrder }: { preset: Preset | "new" | null; onClose: () => void; nextOrder: number }) {
  const toast = useToast();
  const existing = preset && preset !== "new" ? preset : null;
  const [label, setLabel] = useState(existing?.label ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [unit, setUnit] = useState(existing?.unitLabel ?? "");
  const [rate, setRate] = useState(paiseToInput(existing?.defaultRate));
  const [errors, setErrors] = useState<{ label?: string; rate?: string }>({});

  async function save() {
    const parsed = parseRupees(rate);
    const next = {
      label: label.trim() ? undefined : "Add a name for this item",
      rate: rate.trim() && parsed === null ? "Enter an amount like 25000" : undefined,
    };
    setErrors(next);
    if (next.label || next.rate) return;
    const ts = now();
    const record: Preset = {
      id: existing?.id ?? uuid(),
      label: label.trim(),
      description: description.trim() || label.trim(),
      unitLabel: unit.trim(),
      defaultRate: parsed,
      sortOrder: existing?.sortOrder ?? nextOrder,
      createdAt: existing?.createdAt ?? ts,
      updatedAt: ts,
      deletedAt: null,
    };
    await db.presets.put(record);
    toast.show(existing ? "Item saved" : "Item added");
    onClose();
  }

  return (
    <BottomSheet
      open={preset !== null}
      onClose={onClose}
      title={existing ? "Edit item" : "New item"}
      footer={
        <Button fullWidth size="lg" onClick={() => void save()}>
          {existing ? "Save" : "Add item"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <Input label="Chip label" placeholder="YouTube Short" value={label} error={errors.label} onChange={(e) => setLabel(e.target.value)} />
        <Input
          label="Line description"
          optional
          placeholder="YouTube Short, 60 seconds"
          helper="What appears on the invoice. Defaults to the chip label."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          label="Unit name"
          optional
          placeholder="Short"
          helper='Used in history summaries, like "2 Shorts"'
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <Input
          label="Default rate"
          optional
          prefix="₹"
          numeric
          inputMode="decimal"
          placeholder="25000"
          value={rate}
          error={errors.rate}
          onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
        />
        {existing ? (
          <DestructiveButton
            fullWidth
            confirmTitle={`Delete ${existing.label}?`}
            confirmDescription="It won't appear as a quick-add chip anymore. Existing invoices aren't changed."
            confirmLabel="Delete item"
            onConfirm={async () => {
              await db.presets.update(existing.id, { deletedAt: now(), updatedAt: now() });
              toast.show("Item deleted");
              onClose();
            }}
          >
            Delete item
          </DestructiveButton>
        ) : null}
      </div>
    </BottomSheet>
  );
}

export function PresetsScreen() {
  const presets = usePresets();
  const [editing, setEditing] = useState<Preset | "new" | null>(null);
  if (!presets) return null;

  return (
    <PushedScreen title="Saved line items">
      <p className="mb-4 text-[15px] text-soft">These show as quick-add chips on the invoice form. Set default rates to save typing.</p>
      <div className="flex flex-col gap-4">
        <Button variant="secondary" icon={Plus} fullWidth onClick={() => setEditing("new")}>
          Add item
        </Button>
        {presets.length ? (
          <ListGroup>
            {presets.map((p) => (
              <ListRow
                key={p.id}
                title={p.label}
                description={p.description !== p.label ? p.description : undefined}
                value={p.defaultRate !== null ? <span className="tabular">{formatINR(p.defaultRate)}</span> : "No rate"}
                onClick={() => setEditing(p)}
              />
            ))}
          </ListGroup>
        ) : (
          <EmptyState icon={ListBullets} title="No saved items" description="Add the deliverables you sell most often." />
        )}
      </div>
      {editing !== null ? (
        <PresetSheet
          key={editing === "new" ? "new" : editing.id}
          preset={editing}
          onClose={() => setEditing(null)}
          nextOrder={presets.length ? Math.max(...presets.map((p) => p.sortOrder)) + 1 : 0}
        />
      ) : null}
    </PushedScreen>
  );
}
