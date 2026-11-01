"use client";

import { useId } from "react";
import { Minus, Plus } from "@phosphor-icons/react";
import { tap } from "@/lib/haptics";

/** − value + control for small whole-number quantities. No keyboard needed. */
export function Stepper({ label, value, onChange, min = 1, max = 999 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const labelId = useId();
  const set = (n: number) => {
    tap(6);
    onChange(Math.min(max, Math.max(min, n)));
  };
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-full text-ink transition-[background-color,transform] duration-100 hover:bg-line active:scale-95 disabled:text-faint disabled:hover:bg-transparent";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-soft" id={labelId}>
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex h-13 items-center justify-between rounded-key bg-tint px-1">
        <button type="button" className={btn} aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= min} onClick={() => set(Math.floor(value) - 1)}>
          <Minus size={18} weight="bold" aria-hidden="true" />
        </button>
        <span className="num min-w-8 text-center text-[20px] text-ink" aria-live="polite">
          {Number.isInteger(value) ? value : value.toFixed(2)}
        </span>
        <button type="button" className={btn} aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= max} onClick={() => set(Math.floor(value) + 1)}>
          <Plus size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
