"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  CheckCircle,
  Copy,
  DownloadSimple,
  Eye,
  PaperPlaneTilt,
  PencilSimple,
  ShareNetwork,
  type Icon,
} from "@phosphor-icons/react";
import { BottomSheet, Button, ConfirmDialog, DatePicker, DestructiveButton, useToast } from "@/components/ui";
import {
  db,
  deleteInvoice,
  duplicateInvoice,
  getPayment,
  getProfile,
  markAsPaid,
  markAsSent,
  markAsUnpaid,
  now,
} from "@/db";
import { todayISO } from "@/lib/dates";
import { downloadBlob, shareOrDownload } from "@/lib/download";
import { buildInvoiceView } from "@/lib/invoice-view";
import { pdfFileName, renderInvoicePdf } from "@/lib/pdf";
import { useNav } from "@/lib/nav";
import { success, tap } from "@/lib/haptics";
import { displayStatus } from "@/lib/status";
import type { Invoice } from "@/types";

async function viewFor(inv: Invoice) {
  const [profile, payment, party] = await Promise.all([
    getProfile(),
    getPayment(),
    inv.billToId ? db.parties.get(inv.billToId) : Promise.resolve(undefined),
  ]);
  return buildInvoiceView(inv, { profile, payment, party });
}

/**
 * Invoice actions with a small PDF cache. Call `prepare` as soon as an invoice is
 * on screen so Share can run inside the tap (Safari rejects slow share calls).
 */
export function useInvoiceActions() {
  const toast = useToast();
  const nav = useNav();
  const cache = useRef(new Map<string, Promise<Blob>>());
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  const keyOf = (inv: Invoice) => `${inv.id}:${inv.updatedAt}`;

  const prepare = useCallback((inv: Invoice): Promise<Blob> => {
    const key = keyOf(inv);
    let p = cache.current.get(key);
    if (!p) {
      p = viewFor(inv).then(renderInvoicePdf);
      p.catch(() => cache.current.delete(key));
      cache.current.set(key, p);
    }
    return p;
  }, []);

  async function download(inv: Invoice) {
    setBusy("download");
    try {
      downloadBlob(await prepare(inv), pdfFileName(inv.number));
      toast.show("PDF downloaded");
    } catch {
      toast.show("The PDF couldn't be created. Try again");
    } finally {
      setBusy(null);
    }
  }

  async function share(inv: Invoice) {
    setBusy("share");
    try {
      const blob = await prepare(inv);
      const result = await shareOrDownload(blob, pdfFileName(inv.number), `Invoice ${inv.number}`);
      if (result === "downloaded") toast.show("Sharing isn't available here, so the PDF was downloaded");
    } catch {
      toast.show("The PDF couldn't be created. Try again");
    } finally {
      setBusy(null);
    }
  }

  async function markSent(inv: Invoice) {
    await markAsSent(inv.id);
    success();
    toast.show("Marked as sent");
  }

  async function markPaid(inv: Invoice, date: string) {
    const wasPaidDate = inv.paidDate;
    await markAsPaid(inv.id, date);
    success();
    toast.show("Marked as paid", {
      label: "Undo",
      onClick: () => void (wasPaidDate ? markAsPaid(inv.id, wasPaidDate) : markAsUnpaid(inv.id)),
    });
  }

  async function markUnpaid(inv: Invoice) {
    await markAsUnpaid(inv.id);
    toast.show("Marked as pending");
  }

  async function duplicate(inv: Invoice) {
    const id = await duplicateInvoice(inv.id);
    if (!id) return;
    toast.show("Copied as a new draft");
    nav.push({ name: "editor", id });
  }

  async function remove(inv: Invoice) {
    await deleteInvoice(inv.id);
    tap();
    toast.show("Invoice deleted", {
      label: "Undo",
      onClick: () => void db.invoices.update(inv.id, { deletedAt: null, updatedAt: now() }),
    });
  }

  return { prepare, download, share, markSent, markPaid, markUnpaid, duplicate, remove, busy };
}

/** Pick the paid date, then mark as paid. */
export function MarkPaidSheet({
  invoice,
  open,
  onClose,
  onConfirm,
}: {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
  onConfirm: (date: string) => Promise<void>;
}) {
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const tooEarly = date < invoice.invoiceDate;
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Mark as paid"
      footer={
        <Button
          fullWidth
          size="lg"
          icon={CheckCircle}
          loading={busy}
          disabled={!date || tooEarly}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm(date);
              onClose();
            } finally {
              setBusy(false);
            }
          }}
        >
          Mark as paid
        </Button>
      }
    >
      <div className="pt-1">
        <DatePicker
          label="Paid on"
          value={date}
          min={invoice.invoiceDate}
          max={todayISO()}
          error={tooEarly ? "Paid date can't be before the invoice date" : undefined}
          helper={tooEarly ? undefined : "The date the money reached your account"}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
    </BottomSheet>
  );
}

/** Warn before editing an invoice the brand already has. */
export function EditSentDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Edit a sent invoice?"
      description="The brand already has the earlier version. After editing, share the updated PDF so you both have the same copy."
      confirmLabel="Edit invoice"
    />
  );
}

function SheetAction({
  icon: IconCmp,
  label,
  onClick,
  loading,
}: {
  icon: Icon;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        aria-busy={loading || undefined}
        className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-[15px] font-medium transition-colors duration-150 active:opacity-60 disabled:text-faint"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-tint">
          <IconCmp size={20} aria-hidden="true" className="text-ink" />
        </span>
        {label}
      </button>
    </li>
  );
}

/** Row menu for an invoice in History. */
export function InvoiceActionSheet({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const nav = useNav();
  const actions = useInvoiceActions();
  const [paidOpen, setPaidOpen] = useState(false);
  const [editWarn, setEditWarn] = useState(false);
  const status = displayStatus(invoice, todayISO());

  // Start building the PDF as soon as the menu opens.
  const { prepare } = actions;
  useEffect(() => {
    if (open) prepare(invoice).catch(() => {});
  }, [open, invoice, prepare]);

  const run = (fn: () => void | Promise<void>) => async () => {
    await fn();
    onClose();
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={invoice.number}>
        <ul className="-mx-5 divide-y divide-line border-y border-line bg-white">
          <SheetAction icon={Eye} label="View" onClick={() => {
              onClose();
              nav.push({ name: "preview", id: invoice.id });
            }} />
          <SheetAction
            icon={DownloadSimple}
            label={actions.busy === "download" ? "Preparing PDF" : "Download PDF"}
            loading={actions.busy === "download"}
            onClick={run(() => actions.download(invoice))}
          />
          <SheetAction
            icon={ShareNetwork}
            label={actions.busy === "share" ? "Preparing PDF" : "Share PDF"}
            loading={actions.busy === "share"}
            onClick={run(() => actions.share(invoice))}
          />
          {status === "draft" ? (
            <SheetAction icon={PaperPlaneTilt} label="Mark as sent" onClick={run(() => actions.markSent(invoice))} />
          ) : null}
          {status === "pending" || status === "overdue" ? (
            <SheetAction icon={CheckCircle} label="Mark as paid" onClick={() => setPaidOpen(true)} />
          ) : null}
          {status === "paid" ? (
            <SheetAction icon={ArrowCounterClockwise} label="Mark as unpaid" onClick={run(() => actions.markUnpaid(invoice))} />
          ) : null}
          <SheetAction icon={Copy} label="Duplicate" onClick={run(() => actions.duplicate(invoice))} />
          <SheetAction
            icon={PencilSimple}
            label="Edit"
            onClick={() => {
              if (invoice.status === "draft") {
                onClose();
                nav.push({ name: "editor", id: invoice.id });
              } else setEditWarn(true);
            }}
          />
        </ul>
        <div className="pt-4">
          <DestructiveButton
            fullWidth
            confirmTitle={`Delete ${invoice.number}?`}
            confirmDescription="It will be removed from this device. You can undo right after."
            confirmLabel="Delete invoice"
            onConfirm={async () => {
              await actions.remove(invoice);
              onClose();
            }}
          >
            Delete
          </DestructiveButton>
        </div>
      </BottomSheet>
      {paidOpen ? (
        <MarkPaidSheet
          invoice={invoice}
          open={paidOpen}
          onClose={() => {
            setPaidOpen(false);
            onClose();
          }}
          onConfirm={(d) => actions.markPaid(invoice, d)}
        />
      ) : null}
      <EditSentDialog
        open={editWarn}
        onClose={() => setEditWarn(false)}
        onConfirm={() => {
          setEditWarn(false);
          onClose();
          nav.push({ name: "editor", id: invoice.id });
        }}
      />
    </>
  );
}
