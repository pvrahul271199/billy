"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  forceState?: "focus";
}

/** Switch row: label on the left, switch on the right. The whole row is tappable. */
export function Toggle({ checked, onChange, label, description, disabled, forceState }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex min-h-12 items-center justify-between gap-4">
      <label htmlFor={id} className={cn("flex-1 py-2.5", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <span className={cn("block text-[15px] font-medium", disabled ? "text-soft" : "text-ink")}>{label}</span>
        {description ? (
          <span id={`${id}-desc`} className="mt-0.5 block text-[13px] text-soft">
            {description}
          </span>
        ) : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        data-force={forceState}
        onClick={() => {
          tap(6);
          onChange(!checked);
        }}
        className={cn(
          "relative inline-flex h-[30px] w-[50px] shrink-0 items-center rounded-full transition-colors duration-200",
          "after:absolute after:-inset-2 after:content-['']",
          "data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ink",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-ink" : "bg-line",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-[26px] w-[26px] rounded-full bg-white shadow-[0_1px_3px_var(--scrim)] transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </div>
  );
}
