"use client";

import { useState } from "react";
import { MagnifyingGlass, Receipt } from "@phosphor-icons/react";
import { Button, Card, Chip, EmptyState, Input } from "@/components/ui";
import { InvoiceList, InvoiceRow } from "@/components/invoice/InvoiceRow";
import { InvoiceActionSheet } from "@/components/invoice/InvoiceActions";
import { useInvoices, useParties, useToday } from "@/db/queries";
import { formatINR } from "@/lib/format";
import { billToName } from "@/lib/invoice-view";
import { useNav } from "@/lib/nav";
import { financialYear } from "@/lib/numbering";
import { displayStatus } from "@/lib/status";
import { financialYearSummary } from "@/lib/summaries";
import type { DisplayStatus, Invoice } from "@/types";
import { Splash, TabScreen } from "./Screen";

type Filter = "all" | DisplayStatus;
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-medium text-soft">{label}</dt>
      <dd className="num mt-1 text-[16px] break-words text-ink">{formatINR(value)}</dd>
    </div>
  );
}

export function HistoryTab() {
  const nav = useNav();
  const invoices = useInvoices();
  const parties = useParties();
  const today = useToday();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [menuFor, setMenuFor] = useState<Invoice | null>(null);

  if (!invoices || !parties) return <Splash />;

  if (invoices.length === 0) {
    return (
      <TabScreen title="History">
        <EmptyState
          icon={Receipt}
          title="Your invoices will live here"
          description="Bill your first brand collab and keep track of what's pending and what's paid."
          action={
            <Button size="lg" onClick={() => nav.push({ name: "editor" })}>
              Create your first invoice
            </Button>
          }
        />
      </TabScreen>
    );
  }

  const fy = financialYearSummary(invoices, today);
  const rows = invoices.map((inv) => ({ inv, status: displayStatus(inv, today), name: billToName(inv, parties) }));
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const query = q.trim().toLowerCase();
  const shown = rows.filter(
    (r) => (filter === "all" || r.status === filter) && (!query || r.name.toLowerCase().includes(query) || r.inv.number.toLowerCase().includes(query)),
  );

  return (
    <TabScreen title="History" subtitle={`Financial year ${financialYear(today)}`}>
      <div className="flex flex-col gap-4">
        <Card as="section" aria-label="This financial year">
          <dl className="grid grid-cols-3 gap-3">
            <Stat label="Invoiced" value={fy.invoiced} />
            <Stat label="Paid" value={fy.paid} />
            <Stat label="Pending" value={fy.pending} />
          </dl>
        </Card>

        <div role="group" aria-label="Filter by status" className="screen-scroll -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => {
            const n = f.value === "all" ? rows.length : (counts[f.value] ?? 0);
            return (
              <Chip key={f.value} selected={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}{" "}
                <span className="num opacity-70">{n}</span>
              </Chip>
            );
          })}
        </div>

        <Input label="Search" type="search" placeholder="Brand or invoice number" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />

        <p className="sr-only" aria-live="polite">
          {shown.length} {shown.length === 1 ? "invoice" : "invoices"} shown
        </p>

        {shown.length ? (
          <InvoiceList label="Invoices">
            {shown.map((r) => (
              <InvoiceRow key={r.inv.id} invoice={r.inv} billTo={r.name} status={r.status} onMenu={() => setMenuFor(r.inv)} />
            ))}
          </InvoiceList>
        ) : (
          <EmptyState
            icon={MagnifyingGlass}
            title="No matching invoices"
            description={query ? "Try a different brand name or invoice number." : "Nothing with this status right now."}
            action={
              <Button
                variant="tint"
                onClick={() => {
                  setFilter("all");
                  setQ("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}
      </div>
      {menuFor ? <InvoiceActionSheet key={menuFor.id} invoice={menuFor} open onClose={() => setMenuFor(null)} /> : null}
    </TabScreen>
  );
}
