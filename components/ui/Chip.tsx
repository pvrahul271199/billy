"use client";

import type { ButtonHTMLAttributes } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Filter chips: pass selected to make it a toggle (aria-pressed). */
  selected?: boolean;
  icon?: Icon;
}

/** Pill-shaped filter chip (with `selected`) or quick-add chip (with an icon). */
export function Chip({ selected, icon: IconCmp, className, children, onClick, type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      onClick={(e) => {
        tap(6);
        onClick?.(e);
      }}
      className={cn(
        "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap",
        "transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
        "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        "disabled:cursor-not-allowed disabled:text-faint",
        selected ? "bg-ink text-white" : "bg-tint text-soft hover:text-ink active:bg-line",
        IconCmp && !selected && "text-ink",
        className,
      )}
      {...rest}
    >
      {IconCmp ? <IconCmp size={16} weight="bold" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
