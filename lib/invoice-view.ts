import type { Address, BillToSnapshot, InvoiceTemplateId, FromSnapshot, Invoice, Party, PaymentDetails, PaymentSnapshot, Profile, Totals } from "@/types";
import { amountInWords } from "./amount-in-words";
import { formatDate, paymentTermsLabel } from "./dates";
import { formatInstagram, formatINR } from "./format";
import { stateName } from "./states";
import { computeTotals, formatRate, lineAmount } from "./tax";
import { formatPhone } from "./validators";
import { resolveTemplate } from "./invoice-templates";
import { snapshotBillTo, snapshotFrom, snapshotPayment } from "./snapshots";

export interface InvoiceView {
  template: InvoiceTemplateId;
  title: "Invoice" | "Tax Invoice";
  number: string;
  meta: Array<{ label: string; value: string }>;
  from: {
    name: string;
    instagram: string;
    lines: string[];
    logo: string | null;
  };
  billTo: { name: string; lines: string[] } | null;
  campaignFor: string;
  campaignName: string;
  items: Array<{ id: string; description: string; quantity: string; rate: string; amount: string }>;
  totals: Totals;
  summaryLines: Array<{ label: string; value: string }>;
  totalLabel: string;
  totalValue: string;
  amountInWords: string;
  tds: { label: string; value: string; netLabel: string; netValue: string } | null;
  bank: Array<{ label: string; value: string }> | null;
  upi: { id: string; name: string; amount: number; note: string } | null;
  staticQr: string | null;
  notes: string;
  signature: { image: string; name: string } | null;
}

function addressLines(a: Address): string[] {
  const cityLine = [a.city, stateName(a.stateCode)].filter(Boolean).join(", ");
  return [a.line1, a.line2, [cityLine, a.pin].filter(Boolean).join(" ")].map((l) => l.trim()).filter(Boolean);
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export interface ViewSources {
  profile: Profile;
  payment: PaymentDetails;
  party: Party | undefined;
}

/** Resolve frozen snapshots (sent invoices) or live data (drafts) into display-ready content. */
export function buildInvoiceView(inv: Invoice, src: ViewSources): InvoiceView {
  const from: FromSnapshot = inv.fromSnapshot ?? snapshotFrom(src.profile);
  const billTo: BillToSnapshot | null = inv.billToSnapshot ?? (src.party ? snapshotBillTo(src.party) : null);
  const pay: PaymentSnapshot = inv.paymentSnapshot ?? snapshotPayment(src.payment);

  const totals = computeTotals(inv.items, inv);
  const isTax = inv.gstMode !== "none";

  const meta = [
    { label: "Invoice date", value: formatDate(inv.invoiceDate) },
    { label: "Due date", value: inv.dueDate ? formatDate(inv.dueDate) : "" },
    { label: "Terms", value: paymentTermsLabel(inv.paymentTerms) },
    { label: "Delivered on", value: inv.deliveryDate ? formatDate(inv.deliveryDate) : "" },
    { label: "SAC", value: isTax ? inv.sacCode : "" },
  ].filter((m) => m.value);

  const fromLines = [
    ...addressLines(from.address),
    from.email,
    from.phone ? formatPhone(from.phone) : "",
    from.pan ? `PAN: ${from.pan}` : "",
    from.gstin ? `GSTIN: ${from.gstin}` : "",
  ].filter(Boolean);

  const billToView = billTo
    ? {
        name: billTo.name,
        lines: [
          ...addressLines(billTo.address),
          billTo.gstin ? `GSTIN: ${billTo.gstin}` : "",
          billTo.contactPerson ? `Attn: ${billTo.contactPerson}` : "",
          billTo.email,
          billTo.phone ? formatPhone(billTo.phone) : "",
        ].filter(Boolean),
      }
    : null;

  const summaryLines: InvoiceView["summaryLines"] = [{ label: "Subtotal", value: formatINR(totals.subtotal) }];
  if (inv.gstMode === "intra") {
    const half = formatRate(inv.gstRate / 2);
    summaryLines.push({ label: `CGST @ ${half}%`, value: formatINR(totals.cgst) });
    summaryLines.push({ label: `SGST @ ${half}%`, value: formatINR(totals.sgst) });
  } else if (inv.gstMode === "inter") {
    summaryLines.push({ label: `IGST @ ${formatRate(inv.gstRate)}%`, value: formatINR(totals.igst) });
  }

  const tds =
    inv.showTds && inv.tdsRate
      ? {
          label: `Less: expected TDS @ ${formatRate(inv.tdsRate)}%`,
          value: `(${formatINR(totals.tds)})`,
          netLabel: "Net receivable",
          netValue: formatINR(totals.netReceivable),
        }
      : null;

  const hasBank = !!(pay.accountNumber || pay.ifsc);
  const bank =
    inv.includeBank && hasBank
      ? [
          { label: "Account name", value: pay.accountHolder },
          { label: "Account number", value: pay.accountNumber },
          { label: "IFSC", value: pay.ifsc },
          { label: "Bank", value: [pay.bankName, pay.branch].filter(Boolean).join(", ") },
          { label: "UPI", value: pay.upiId },
        ].filter((r) => r.value)
      : null;

  const upi =
    inv.includeUpiQr && pay.upiId && totals.total > 0
      ? { id: pay.upiId, name: pay.accountHolder || from.fullName, amount: totals.total, note: inv.number }
      : null;

  return {
    template: resolveTemplate(inv.template, src.profile.invoiceTemplate),
    title: isTax ? "Tax Invoice" : "Invoice",
    number: inv.number,
    meta,
    from: { name: from.fullName, instagram: formatInstagram(from.instagram), lines: fromLines, logo: from.logo },
    billTo: billToView,
    campaignFor: inv.viaAgency && inv.endBrandName ? inv.endBrandName : "",
    campaignName: inv.campaignName,
    items: inv.items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: formatQty(i.quantity),
      rate: formatINR(i.rate),
      amount: formatINR(lineAmount(i)),
    })),
    totals,
    summaryLines,
    totalLabel: "Total",
    totalValue: formatINR(totals.total),
    amountInWords: amountInWords(totals.total),
    tds,
    bank,
    upi,
    staticQr: inv.includeUpiQr && !upi ? pay.staticQr : null,
    notes: inv.notes.trim(),
    signature: inv.includeSignature && from.signature ? { image: from.signature, name: from.fullName } : null,
  };
}

/** Bill-to display name for lists (snapshot first, then live party). */
export function billToName(inv: Invoice, parties: Party[]): string {
  return inv.billToSnapshot?.name ?? parties.find((p) => p.id === inv.billToId)?.name ?? "No brand yet";
}
