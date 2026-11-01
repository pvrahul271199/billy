import type { ISODate, Invoice, Paise } from "@/types";
import { displayStatus } from "./status";
import { computeTotals } from "./tax";
import { financialYearEnd, financialYearStart } from "./numbering";

export interface Summary {
  invoiced: Paise;
  paid: Paise;
  pending: Paise;
  overdue: Paise;
  pendingCount: number;
  overdueCount: number;
}

const totalOf = (i: Invoice) => computeTotals(i.items, i).total;

/** Outstanding money across all time: pending + overdue. */
export function outstanding(invoices: Invoice[], today: ISODate): Summary {
  return summarise(invoices.filter((i) => !i.deletedAt), today);
}

/** Totals for invoices dated in the financial year containing `today`. Drafts are excluded. */
export function financialYearSummary(invoices: Invoice[], today: ISODate): Summary {
  const start = financialYearStart(today);
  const end = financialYearEnd(today);
  return summarise(
    invoices.filter((i) => !i.deletedAt && i.invoiceDate >= start && i.invoiceDate <= end),
    today,
  );
}

function summarise(list: Invoice[], today: ISODate): Summary {
  const s: Summary = { invoiced: 0, paid: 0, pending: 0, overdue: 0, pendingCount: 0, overdueCount: 0 };
  for (const inv of list) {
    if (inv.status === "draft") continue;
    const t = totalOf(inv);
    s.invoiced += t;
    const st = displayStatus(inv, today);
    if (st === "paid") s.paid += t;
    else {
      s.pending += t;
      s.pendingCount += 1;
      if (st === "overdue") {
        s.overdue += t;
        s.overdueCount += 1;
      }
    }
  }
  return s;
}
