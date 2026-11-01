"use client";

import { useState } from "react";
import { ArrowRight, Plus, Receipt, WarningCircle } from "@phosphor-icons/react";
import { Amount, Button, EmptyState } from "@/components/ui";
import { InvoiceList, InvoiceRow } from "@/components/invoice/InvoiceRow";
import { InvoiceActionSheet } from "@/components/invoice/InvoiceActions";
import { useInvoices, useParties, useProfile, useToday } from "@/db/queries";
import { formatINR } from "@/lib/format";
import { billToName } from "@/lib/invoice-view";
import { useNav } from "@/lib/nav";
import { displayStatus } from "@/lib/status";
import { outstanding } from "@/lib/summaries";
import type { Invoice } from "@/types";
import { Splash, TabScreen } from "./Screen";

export function InvoiceTab() {
  const nav = useNav();
  const invoices = useInvoices();
  const parties = useParties();
  const profile = useProfile();
  const today = useToday();
  const [menuFor, setMenuFor] = useState<Invoice | null>(null);

  if (!invoices || !parties || !profile) return <Splash />;

  const s = outstanding(invoices, today);
  const recent = invoices.slice(0, 5);
  const firstName = profile.fullName.trim().split(/\s+/)[0];

  return (
    <TabScreen
      title="Pending"
      subtitle={firstName ? `Hi ${firstName}` : undefined}
      footer={
        <Button icon={Plus} fullWidth size="lg" onClick={() => nav.push({ name: "editor" })}>
          New invoice
        </Button>
      }
    >
      <section aria-label="Pending amount" className="flex flex-col gap-2 px-1 pb-6">
        <p className="text-[56px] leading-[1.05] text-ink">
          <Amount value={formatINR(s.pending)} />
        </p>
        <p className="text-[14px] text-soft">
          {s.pendingCount
            ? `${s.pendingCount} ${s.pendingCount === 1 ? "invoice" : "invoices"} awaiting payment`
            : "Nothing pending right now"}
        </p>
        {s.overdueCount ? (
          <button
            type="button"
            onClick={() => nav.setTab("history")}
            className="mt-2 flex items-center gap-2.5 rounded-key bg-warm-bg px-3.5 py-3 text-left text-[14px] font-medium text-warm transition-transform active:scale-[0.99]"
          >
            <WarningCircle size={20} weight="bold" aria-hidden="true" className="shrink-0" />
            <span className="flex-1">
              <span className="num">{formatINR(s.overdue)}</span> overdue across {s.overdueCount}{" "}
              {s.overdueCount === 1 ? "invoice" : "invoices"}
            </span>
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </button>
        ) : null}
      </section>

      <section aria-labelledby="recent-title" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 id="recent-title" className="text-[13px] font-semibold text-soft">
            Recent
          </h2>
          {invoices.length > recent.length ? (
            <button type="button" onClick={() => nav.setTab("history")} className="rounded-[6px] text-[13px] font-semibold text-ink">
              See all {invoices.length}
            </button>
          ) : null}
        </div>
        {recent.length ? (
          <InvoiceList label="Recent invoices">
            {recent.map((inv) => (
              <InvoiceRow key={inv.id} invoice={inv} billTo={billToName(inv, parties)} status={displayStatus(inv, today)} onMenu={() => setMenuFor(inv)} />
            ))}
          </InvoiceList>
        ) : (
          <div className="rounded-note border border-line">
            <EmptyState icon={Receipt} title="No invoices yet" description="Bill your first brand collab. It takes about a minute." />
          </div>
        )}
      </section>
      {menuFor ? <InvoiceActionSheet key={menuFor.id} invoice={menuFor} open onClose={() => setMenuFor(null)} /> : null}
    </TabScreen>
  );
}
