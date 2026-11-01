"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { AmountField, Chip, IconButton, Input, Stepper } from "@/components/ui";
import { uuid } from "@/db";
import { formatINR } from "@/lib/format";
import { lineAmount } from "@/lib/tax";
import type { LineItem, Preset } from "@/types";

export interface ItemErrors {
  description?: string;
  rate?: string;
}

function ItemRow({
  item,
  index,
  errors,
  onChange,
  onRemove,
  autoFocus,
}: {
  item: LineItem;
  index: number;
  errors?: ItemErrors;
  onChange: (i: LineItem) => void;
  onRemove: () => void;
  autoFocus: boolean;
}) {
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // New custom items start with the description; preset items are ready to price.
    if (autoFocus && !item.description) descRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = index + 1;
  return (
    <li className="rounded-note border border-line bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-soft">Item {n}</h3>
        <IconButton icon={X} label={`Remove item ${n}`} onClick={onRemove} className="-mt-2 -mr-2" />
      </div>
      <div className="flex flex-col gap-3">
        <Input
          ref={descRef}
          id={`item-${item.id}-description`}
          label="Description"
          placeholder="Instagram Reel, 60 seconds"
          value={item.description}
          error={errors?.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
        />
        <div className="grid grid-cols-[2fr_3fr] gap-3">
          <Stepper label="Qty" value={item.quantity} onChange={(quantity) => onChange({ ...item, quantity })} />
          <AmountField
            id={`item-${item.id}-rate`}
            label="Rate"
            value={item.rate || null}
            error={errors?.rate}
            placeholder="25,000"
            onChange={(rate) => onChange({ ...item, rate: rate ?? 0 })}
          />
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-[13px] font-medium text-soft">Amount</span>
          <span className="num text-[18px] text-ink">{formatINR(lineAmount(item))}</span>
        </div>
      </div>
    </li>
  );
}

export function LineItemsEditor({
  items,
  presets,
  errors,
  onChange,
}: {
  items: LineItem[];
  presets: Preset[];
  errors: Record<string, ItemErrors>;
  onChange: (items: LineItem[]) => void;
}) {
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  function add(p: Pick<LineItem, "description" | "unitLabel" | "rate">) {
    const item: LineItem = { id: uuid(), quantity: 1, ...p };
    setLastAdded(item.id);
    onChange([...items, item]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p id="quick-add-label" className="mb-2 text-[13px] font-medium text-soft">
          Quick add
        </p>
        <div className="screen-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-labelledby="quick-add-label">
          {presets.map((p) => (
            <Chip key={p.id} icon={Plus} onClick={() => add({ description: p.description || p.label, unitLabel: p.unitLabel, rate: p.defaultRate ?? 0 })}>
              {p.label}
            </Chip>
          ))}
          <Chip icon={Plus} onClick={() => add({ description: "", unitLabel: "", rate: 0 })}>
            Custom
          </Chip>
        </div>
      </div>
      {items.length ? (
        <ol className="flex flex-col gap-3">
          {items.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              index={i}
              errors={errors[item.id]}
              autoFocus={item.id === lastAdded}
              onChange={(next) => onChange(items.map((x) => (x.id === item.id ? next : x)))}
              onRemove={() => onChange(items.filter((x) => x.id !== item.id))}
            />
          ))}
        </ol>
      ) : null}
    </div>
  );
}
