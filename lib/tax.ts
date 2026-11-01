import type { GstMode, LineItem, Paise, Totals } from "@/types";

export const DEFAULT_GST_RATE = 18;

/** Line amount in paise: quantity × rate, rounded to the nearest paisa. */
export function lineAmount(item: Pick<LineItem, "quantity" | "rate">): Paise {
  return Math.round(item.quantity * item.rate);
}

/**
 * GST split for a GST-registered creator:
 * same state as the bill-to party → CGST + SGST ("intra"), different → IGST ("inter").
 * When the party's state is unknown we assume intra-state.
 */
export function gstModeFor(gstRegistered: boolean, creatorState: string, partyState: string): GstMode {
  if (!gstRegistered) return "none";
  if (creatorState && partyState && creatorState !== partyState) return "inter";
  return "intra";
}

export interface TaxOptions {
  gstMode: GstMode;
  /** Total GST percent, e.g. 18. */
  gstRate: number;
  showTds: boolean;
  tdsRate: number | null;
}

/**
 * All invoice totals in paise.
 * TDS is informational: it is calculated on the subtotal (GST excluded)
 * and never reduces the invoice total.
 */
export function computeTotals(items: Array<Pick<LineItem, "quantity" | "rate">>, opts: TaxOptions): Totals {
  const subtotal = items.reduce((sum, i) => sum + lineAmount(i), 0);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (opts.gstMode === "intra") {
    const half = Math.round((subtotal * opts.gstRate) / 200);
    cgst = half;
    sgst = half;
  } else if (opts.gstMode === "inter") {
    igst = Math.round((subtotal * opts.gstRate) / 100);
  }
  const total = subtotal + cgst + sgst + igst;
  const tds = opts.showTds && opts.tdsRate ? Math.round((subtotal * opts.tdsRate) / 100) : 0;
  return { subtotal, cgst, sgst, igst, total, tds, netReceivable: total - tds };
}

/** Format a percentage without trailing zeros: 9 → "9", 7.5 → "7.5". */
export function formatRate(rate: number): string {
  return String(Math.round(rate * 100) / 100);
}
