"use client";

import { useEffect } from "react";
import { Backspace } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import { applyKey, type KeypadKey } from "@/lib/keypad";

export { applyKey, type KeypadKey };

const KEYS: KeypadKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

/**
 * ATM-style number pad that stays in the thumb zone, so the phone keyboard
 * never pops up and pushes the layout around. Also accepts a physical keyboard.
 */
export function Keypad({ onKey, onEnter, allowDecimal = true }: { onKey: (k: KeypadKey) => void; onEnter?: () => void; allowDecimal?: boolean }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) onKey(e.key as KeypadKey);
      else if (e.key === "." && allowDecimal) onKey(".");
      else if (e.key === "Backspace") onKey("back");
      else if (e.key === "Enter" && onEnter) onEnter();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKey, onEnter, allowDecimal]);

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Number pad">
      {KEYS.map((k) => {
        const disabled = k === "." && !allowDecimal;
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            aria-label={k === "back" ? "Delete" : k === "." ? "Decimal point" : k}
            onClick={() => {
              tap(8);
              onKey(k);
            }}
            className={cn(
              "num flex h-14 items-center justify-center rounded-key bg-tint text-[24px] text-ink transition-[background-color,transform] duration-100",
              "hover:bg-line active:scale-[0.96] active:bg-line disabled:invisible",
            )}
          >
            {k === "back" ? <Backspace size={24} aria-hidden="true" /> : k}
          </button>
        );
      })}
    </div>
  );
}
