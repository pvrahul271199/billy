"use client";

import { DotsThreeVertical } from "@phosphor-icons/react";
import { IconButton, StatusPill } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { useNav } from "@/lib/nav";
import { itemSummary } from "@/lib/summary";
import { computeTotals } from "@/lib/tax";
import type { DisplayStatus, Invoice } from "@/types";

export function InvoiceRow({
  invoice,
  billTo,
  status,
  onMenu,
}: {
  invoice: Invoice;
  billTo: string;
  status: DisplayStatus;
  onMenu: () => void;
}) {
  const nav = useNav();
  const total = computeTotals(invoice.items, invoice).total;
  return (
    <li className="flex items-stretch">
      <button
        type="button"
        onClick={() => nav.push({ name: "preview", id: invoice.id })}
        className="flex min-w-0 flex-1 gap-3 py-3.5 pl-4 text-left transition-colors duration-150 active:opacity-60 focus-visible:-outline-offset-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{billTo}</span>
          <span className="block truncate text-[13px] text-soft">{itemSummary(invoice.items)}</span>
          <span className="mt-1 block truncate text-[12px] text-soft tabular">
            {invoice.number} · {formatDate(invoice.invoiceDate)}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="num text-[17px] text-ink">{formatINR(total)}</span>
          <StatusPill status={status} />
        </span>
      </button>
      <div className="flex items-center">
        <IconButton icon={DotsThreeVertical} weight="bold" label={`Actions for ${invoice.number}`} aria-haspopup="dialog" onClick={onMenu} />
      </div>
    </li>
  );
}

/** Hairline list container for invoice rows. */
export function InvoiceList({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <ul aria-label={label} className="divide-y divide-line overflow-hidden rounded-note border border-line bg-white">
      {children}
    </ul>
  );
}
