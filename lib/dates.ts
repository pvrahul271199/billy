import type { ISODate, PaymentTerms } from "@/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Local date as yyyy-mm-dd. */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

/** Parse yyyy-mm-dd as a local date (no time-zone shift). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "31 Oct 2026" */
export function formatDate(iso: ISODate | null | undefined): string {
  if (!iso) return "";
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const PAYMENT_TERM_OPTIONS: Array<{ value: PaymentTerms; label: string; days: number | null }> = [
  { value: "due_on_receipt", label: "Due on receipt", days: 0 },
  { value: "net_7", label: "Net 7", days: 7 },
  { value: "net_15", label: "Net 15", days: 15 },
  { value: "net_30", label: "Net 30", days: 30 },
  { value: "custom", label: "Custom", days: null },
];

export function paymentTermsLabel(terms: PaymentTerms): string {
  return PAYMENT_TERM_OPTIONS.find((t) => t.value === terms)?.label ?? "";
}

/** Due date implied by payment terms. Custom keeps the current due date. */
export function dueDateFor(terms: PaymentTerms, invoiceDate: ISODate, currentDue: ISODate): ISODate {
  const days = PAYMENT_TERM_OPTIONS.find((t) => t.value === terms)?.days;
  if (days === null || days === undefined) return currentDue || invoiceDate;
  return addDays(invoiceDate, days);
}
