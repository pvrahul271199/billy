import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A key amount, set in Bricolage Grotesque with tabular figures. */
export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("num text-ink", className)}>{children}</span>;
}

/** Large amount with a lighter ₹ and paise, like a hardware display. */
export function Amount({ value, className }: { value: string; className?: string }) {
  // "₹1,23,456.00" → symbol, rupees, paise
  const m = /^(₹)?([\d,]+)(\.\d{2})?$/.exec(value);
  if (!m) return <span className={cn("num", className)}>{value}</span>;
  return (
    <span className={cn("num inline-flex items-baseline", className)} aria-label={value}>
      <span aria-hidden="true" className="mr-[0.08em] text-[0.6em] text-faint">
        {m[1]}
      </span>
      <span aria-hidden="true">{m[2]}</span>
      <span aria-hidden="true" className="text-[0.45em] text-soft">
        {m[3]}
      </span>
    </span>
  );
}
