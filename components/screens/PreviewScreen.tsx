"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwise,
  CheckCircle,
  Copy,
  DotsThreeVertical,
  DownloadSimple,
  PaperPlaneTilt,
  PencilSimple,
  ShareNetwork,
} from "@phosphor-icons/react";
import { BottomSheet, Button, DestructiveButton, IconButton, StatusPill } from "@/components/ui";
import { InvoiceSheet } from "@/components/invoice/InvoiceSheet";
import { EditSentDialog, MarkPaidSheet, useInvoiceActions } from "@/components/invoice/InvoiceActions";
import { useInvoice, useParties, usePayment, useProfile, useToday } from "@/db/queries";
import { formatDate } from "@/lib/dates";
import { buildInvoiceView } from "@/lib/invoice-view";
import { useNav } from "@/lib/nav";
import { displayStatus } from "@/lib/status";
import { PushedScreen, Splash } from "./Screen";

/** Invoice preview: renders exactly like the PDF, with the next action in the thumb zone. */
export function PreviewScreen({ id }: { id: string }) {
  const nav = useNav();
  const invoice = useInvoice(id);
  const profile = useProfile();
  const payment = usePayment();
  const parties = useParties();
  const today = useToday();
  const actions = useInvoiceActions();
  const [paidOpen, setPaidOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [editWarn, setEditWarn] = useState(false);

  const view = useMemo(() => {
    if (!invoice || !profile || !payment || !parties) return null;
    return buildInvoiceView(invoice, { profile, payment, party: parties.find((p) => p.id === invoice.billToId) });
  }, [invoice, profile, payment, parties]);

  // Build the PDF in the background so Share runs instantly on tap.
  const { prepare } = actions;
  useEffect(() => {
    if (invoice && !invoice.deletedAt) prepare(invoice).catch(() => {});
  }, [invoice, prepare]);

  // Deleted (or missing): leave the screen.
  const { pop } = nav;
  useEffect(() => {
    if (invoice === null || invoice?.deletedAt) pop();
  }, [invoice, pop]);

  if (!invoice || !view || invoice.deletedAt) return <Splash />;

  const status = displayStatus(invoice, today);
  const openEditor = () => nav.push({ name: "editor", id: invoice.id });
  const edit = () => (invoice.status === "draft" ? openEditor() : setEditWarn(true));

  let primary: React.ReactNode;
  if (status === "draft") {
    primary = (
      <Button fullWidth size="lg" icon={PaperPlaneTilt} onClick={() => void actions.markSent(invoice)}>
        Mark as sent
      </Button>
    );
  } else if (status === "pending" || status === "overdue") {
    primary = (
      <Button fullWidth size="lg" icon={CheckCircle} onClick={() => setPaidOpen(true)}>
        Mark as paid
      </Button>
    );
  } else {
    primary = (
      <Button fullWidth size="lg" icon={ShareNetwork} loading={actions.busy === "share"} onClick={() => void actions.share(invoice)}>
        Share PDF
      </Button>
    );
  }

  let statusLine = "";
  if (status === "draft") statusLine = "Mark as sent once you've shared it with the brand";
  if (status === "pending") statusLine = `Due ${formatDate(invoice.dueDate)}`;
  if (status === "overdue") statusLine = `Was due ${formatDate(invoice.dueDate)}`;
  if (status === "paid") statusLine = `Paid on ${formatDate(invoice.paidDate)}`;

  return (
    <PushedScreen
      title={invoice.number}
      padded={false}
      actions={
        <>
          <IconButton icon={PencilSimple} label="Edit" onClick={edit} />
          <IconButton icon={DotsThreeVertical} weight="bold" label="More actions" aria-haspopup="dialog" onClick={() => setMoreOpen(true)} />
        </>
      }
      footer={
        <div className="flex flex-col gap-2">
          {primary}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="tint" icon={DownloadSimple} loading={actions.busy === "download"} onClick={() => void actions.download(invoice)}>
              Download
            </Button>
            {status === "paid" ? (
              <Button variant="tint" icon={PencilSimple} onClick={edit}>
                Edit
              </Button>
            ) : (
              <Button variant="tint" icon={ShareNetwork} loading={actions.busy === "share"} onClick={() => void actions.share(invoice)}>
                Share
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 bg-tint px-4 pt-4 pb-6">
        <div className="flex items-center gap-2.5">
          <StatusPill status={status} />
          <p className="text-[13px] text-soft">{statusLine}</p>
        </div>
        <InvoiceSheet view={view} />
      </div>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More actions">
        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="tint"
            icon={Copy}
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              void actions.duplicate(invoice);
            }}
          >
            Duplicate
          </Button>
          {status === "paid" ? (
            <Button
              variant="tint"
              icon={ArrowCounterClockwise}
              fullWidth
              onClick={() => {
                setMoreOpen(false);
                void actions.markUnpaid(invoice);
              }}
            >
              Mark as unpaid
            </Button>
          ) : null}
          <DestructiveButton
            fullWidth
            confirmTitle={`Delete ${invoice.number}?`}
            confirmDescription="It will be removed from this device. You can undo right after."
            confirmLabel="Delete invoice"
            onConfirm={async () => {
              setMoreOpen(false);
              await actions.remove(invoice);
            }}
          >
            Delete
          </DestructiveButton>
        </div>
      </BottomSheet>

      {paidOpen ? (
        <MarkPaidSheet invoice={invoice} open={paidOpen} onClose={() => setPaidOpen(false)} onConfirm={(d) => actions.markPaid(invoice, d)} />
      ) : null}
      <EditSentDialog
        open={editWarn}
        onClose={() => setEditWarn(false)}
        onConfirm={() => {
          setEditWarn(false);
          openEditor();
        }}
      />
    </PushedScreen>
  );
}
