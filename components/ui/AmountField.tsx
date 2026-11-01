"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { paiseToInput, parseRupees } from "@/lib/money";
import type { Paise } from "@/types";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { Field, controlBase, describedBy } from "./Field";
import { Keypad, applyKey, type KeypadKey } from "./Keypad";

export interface AmountFieldProps {
  id?: string;
  label: string;
  value: Paise | null;
  onChange: (paise: Paise | null) => void;
  error?: string;
  helper?: string;
  optional?: boolean;
  placeholder?: string;
}

/** "25000.5" → "25,000.5" for the live display while typing. */
function groupTyped(v: string): string {
  if (!v) return "0";
  const [whole = "0", frac] = v.split(".");
  const grouped = Number(whole).toLocaleString("en-IN");
  return frac !== undefined ? `${grouped}.${frac}` : grouped;
}

/**
 * Money input that opens the in-app keypad in a sheet instead of the phone
 * keyboard. Shows the amount in Bricolage with en-IN grouping.
 */
export function AmountField({ id, label, value, onChange, error, helper, optional, placeholder = "0" }: AmountFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const begin = () => {
    setDraft(value ? paiseToInput(value) : "");
    setOpen(true);
  };
  const commit = () => {
    onChange(parseRupees(draft));
    setOpen(false);
  };
  const onKey = (k: KeypadKey) => setDraft((d) => applyKey(d, k));

  return (
    <Field id={fieldId} label={label} helper={helper} error={error} optional={optional}>
      <button
        id={fieldId}
        type="button"
        onClick={begin}
        aria-haspopup="dialog"
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(fieldId, helper, error)}
        data-invalid={!!error}
        className={cn(controlBase, "flex h-13 items-center justify-between gap-2 px-4 text-left focus-visible:border-ink focus-visible:outline-none")}
      >
        <span className="text-faint" aria-hidden="true">
          ₹
        </span>
        <span className={cn("num text-[18px]", value ? "text-ink" : "text-faint")}>
          {value ? formatINR(value).replace("₹", "") : placeholder}
        </span>
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        footer={
          <Button fullWidth size="lg" onClick={commit}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-5 pt-2">
          <p id={titleId} className="num flex items-baseline justify-center gap-1 py-2 text-[44px] leading-none text-ink" aria-live="polite">
            <span className="text-[26px] text-faint" aria-hidden="true">
              ₹
            </span>
            {groupTyped(draft)}
          </p>
          <Keypad onKey={onKey} onEnter={commit} />
        </div>
      </BottomSheet>
    </Field>
  );
}
