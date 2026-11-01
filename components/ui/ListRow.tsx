"use client";

import type { ReactNode } from "react";
import { CaretRight, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface ListRowProps {
  title: string;
  icon?: Icon;
  value?: ReactNode;
  description?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  disabled?: boolean;
}

const rowClass =
  "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-opacity duration-150 " +
  "active:opacity-60 focus-visible:-outline-offset-2 " +
  "disabled:cursor-not-allowed ";

/** Settings-style row: icon tile, title, value, chevron. */
export function ListRow({ title, icon: IconCmp, value, description, onClick, chevron = true, disabled }: ListRowProps) {
  const inner = (
    <>
      {IconCmp ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-tint">
          <IconCmp size={20} aria-hidden="true" className={disabled ? "text-faint" : "text-ink"} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[15px] font-medium", disabled ? "text-soft" : "text-ink")}>{title}</span>
        {description ? <span className="mt-0.5 block truncate text-[13px] text-soft">{description}</span> : null}
      </span>
      {value !== undefined ? <span className="max-w-[45%] shrink-0 truncate text-[13px] text-soft">{value}</span> : null}
      {chevron ? <CaretRight size={16} weight="bold" aria-hidden="true" className="shrink-0 text-faint" /> : null}
    </>
  );

  if (onClick || disabled) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={rowClass}>
        {inner}
      </button>
    );
  }
  return <div className={cn(rowClass, "active:opacity-100")}>{inner}</div>;
}

/** Hairline-bordered group of rows. */
export function ListGroup({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <section aria-label={label}>
      {label ? <h2 className="mb-2 px-1 text-[13px] font-medium text-soft">{label}</h2> : null}
      <div className="divide-y divide-line overflow-hidden rounded-note border border-line bg-white">{children}</div>
    </section>
  );
}
