import type { ISODate } from "@/types";
import { parseISODate } from "./dates";

export const MAX_INVOICE_NUMBER_LENGTH = 16;
export const DEFAULT_PREFIX = "BLY";

/** Indian financial year (April–March) label: 2026-10-31 → "26-27", 2027-02-01 → "26-27". */
export function financialYear(date: ISODate): string {
  const d = parseISODate(date);
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  const yy = (n: number) => String(n % 100).padStart(2, "0");
  return `${yy(startYear)}-${yy(startYear + 1)}`;
}

/** First day of the financial year that contains `date`. */
export function financialYearStart(date: ISODate): ISODate {
  const d = parseISODate(date);
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-04-01`;
}

/** Last day of the financial year that contains `date`. */
export function financialYearEnd(date: ISODate): ISODate {
  const start = Number(financialYearStart(date).slice(0, 4));
  return `${start + 1}-03-31`;
}

/** Keep prefixes short and safe: letters, digits and dashes, max 6 characters. */
export function sanitizePrefix(prefix: string): string {
  return prefix.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 6);
}

/**
 * Next number in the sequence for the financial year of `date`, e.g. "BLY/26-27/004".
 * Looks at existing numbers that follow the same prefix/FY pattern and takes max + 1.
 */
export function nextInvoiceNumber(prefix: string, date: ISODate, existing: string[]): string {
  const p = sanitizePrefix(prefix) || DEFAULT_PREFIX;
  const fy = financialYear(date);
  const head = `${p}/${fy}/`;
  let max = 0;
  for (const n of existing) {
    if (!n.startsWith(head)) continue;
    const seq = Number(n.slice(head.length));
    if (Number.isInteger(seq) && seq > max) max = seq;
  }
  return `${head}${String(max + 1).padStart(3, "0")}`;
}

/** Validate an invoice number. Returns an error message or null. */
export function invoiceNumberError(number: string, otherNumbers: string[]): string | null {
  const n = number.trim();
  if (!n) return "Add an invoice number";
  if (n.length > MAX_INVOICE_NUMBER_LENGTH) return `Invoice number can have up to ${MAX_INVOICE_NUMBER_LENGTH} characters`;
  if (!/^[A-Za-z0-9/\-_.]+$/.test(n)) return "Use only letters, numbers, / - _ and .";
  if (otherNumbers.some((o) => o.trim().toLowerCase() === n.toLowerCase())) return "This invoice number is already used. Pick another";
  return null;
}
