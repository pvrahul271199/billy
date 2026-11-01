import type { DisplayStatus, ISODate, Invoice } from "@/types";

/** Overdue is computed: pending and the due date has passed. */
export function displayStatus(inv: Pick<Invoice, "status" | "dueDate">, today: ISODate): DisplayStatus {
  if (inv.status === "pending" && inv.dueDate && inv.dueDate < today) return "overdue";
  return inv.status;
}
