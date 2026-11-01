"use client";

import { useState } from "react";
import { Buildings, Check, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { BottomSheet, Button, EmptyState, Input } from "@/components/ui";
import { PartyForm } from "@/components/profile/PartyForm";
import { newParty, saveParty } from "@/db";
import { stateName } from "@/lib/states";
import { cn } from "@/lib/cn";
import type { Party, PartyType } from "@/types";

export interface BrandPickerProps {
  open: boolean;
  onClose: () => void;
  parties: Party[];
  selectedId: string | null;
  /** When billing via an agency, new entries default to agency and agencies are listed first. */
  preferType: PartyType;
  onPick: (p: Party) => void;
}

/** Searchable bottom sheet to pick a saved brand, or add one inline. */
export function BrandPicker({ open, onClose, parties, selectedId, preferType, onPick }: BrandPickerProps) {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState<Party | null>(null);

  const close = () => {
    setAdding(null);
    setQ("");
    onClose();
  };

  const query = q.trim().toLowerCase();
  const list = parties
    .filter((p) => !query || p.name.toLowerCase().includes(query))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === preferType ? -1 : 1));

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={adding ? (adding.type === "agency" ? "New agency" : "New brand") : preferType === "agency" ? "Choose agency" : "Bill to"}
    >
      {adding ? (
        <div className="pt-1">
          <PartyForm
            initial={adding}
            submitLabel={adding.type === "agency" ? "Add agency" : "Add brand"}
            secondary={
              <Button variant="ghost" size="lg" fullWidth onClick={() => setAdding(null)}>
                Back to list
              </Button>
            }
            onSubmit={async (p) => {
              await saveParty(p);
              onPick(p);
              close();
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3 pt-1">
          {parties.length > 0 ? (
            <Input
              label="Search"
              type="search"
              placeholder="Mamaearth"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          ) : null}
          <Button
            variant="secondary"
            icon={Plus}
            fullWidth
            onClick={() => setAdding({ ...newParty(preferType), name: q.trim() })}
          >
            {q.trim() ? `Add "${q.trim()}"` : preferType === "agency" ? "Add new agency" : "Add new brand"}
          </Button>
          {list.length ? (
            <ul className="divide-y divide-line overflow-hidden rounded-note border border-line" role="listbox" aria-label="Saved brands and agencies">
              {list.map((p) => {
                const selected = p.id === selectedId;
                return (
                  <li key={p.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(p);
                        close();
                      }}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-tint active:bg-line",
                        selected && "bg-tint",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[15px]", selected && "font-medium")}>{p.name}</span>
                        <span className="block truncate text-sm text-soft">
                          {[p.type === "agency" ? "Agency" : "Brand", stateName(p.address.stateCode)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      {selected ? <Check size={20} aria-label="Selected" className="shrink-0" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : parties.length ? (
            <EmptyState icon={MagnifyingGlass} title="No matches" description="Add it as a new brand." />
          ) : (
            <EmptyState icon={Buildings} title="No saved brands yet" description="Add the brand once and pick it on every invoice after." />
          )}
        </div>
      )}
    </BottomSheet>
  );
}
