"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export interface Segment<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/** Radio-group style switch between 2–4 options. Arrow keys move the selection. */
export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + segments.length) % segments.length;
    const seg = segments[next];
    if (!seg) return;
    onChange(seg.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className="flex gap-1 rounded-full bg-tint p-1"
    >
      {segments.map((seg, i) => {
        const selected = seg.value === value;
        return (
          <button
            key={seg.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(seg.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "h-10 flex-1 rounded-full px-3 text-[14px] transition-colors duration-150 disabled:cursor-not-allowed",
              selected
                ? "bg-white font-semibold text-ink shadow-[0_1px_3px_var(--scrim)]"
                : "font-medium text-soft hover:text-ink disabled:text-faint",
            )}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
