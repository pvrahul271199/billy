import type { Paise } from "@/types";

/** Parse user input like "25,000" or "1250.5" into paise. Returns null when not a number. */
export function parseRupees(input: string): Paise | null {
  const clean = input.replace(/[₹,\s]/g, "");
  if (clean === "") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/** Paise as an editable rupee string without grouping: 2500000 → "25000", 12550 → "125.50". */
export function paiseToInput(paise: Paise | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

/** Parse a percentage like "18" or "7.5". Returns null when empty or invalid. */
export function parsePercent(input: string): number | null {
  const clean = input.replace(/[%\s]/g, "");
  if (clean === "") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const n = Number(clean);
  return n <= 100 ? n : null;
}

/** Parse a quantity (positive, up to 2 decimals). */
export function parseQuantity(input: string): number | null {
  const clean = input.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return null;
  const n = Number(clean);
  return n > 0 ? n : null;
}
