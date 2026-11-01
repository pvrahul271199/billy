import type { InvoiceView } from "./invoice-view";
import { formatINR } from "./format";
import { amountInWords } from "./amount-in-words";
import { computeTotals, lineAmount } from "./tax";

const items = [
  { id: "1", description: "Instagram Reel, 30 sec, skincare launch", quantity: 1, rate: 2500000 },
  { id: "2", description: "Instagram Story set (3 frames)", quantity: 3, rate: 300000 },
];

/** Sample invoice for the onboarding demo. Fictional people and numbers. */
export function demoInvoiceView(): InvoiceView {
  const totals = computeTotals(items, { gstMode: "intra", gstRate: 18, showTds: false, tdsRate: null });
  return {
    title: "Tax Invoice",
    number: "BLY/26-27/001",
    meta: [
      { label: "Invoice date", value: "01 Nov 2026" },
      { label: "Due date", value: "16 Nov 2026" },
      { label: "Terms", value: "Net 15" },
    ],
    from: { name: "Priya Sharma", instagram: "@priya.creates", lines: ["Indiranagar, Bengaluru, Karnataka 560038", "PAN: ABCPS1234K"], logo: null },
    billTo: { name: "Glow Naturals Pvt Ltd", lines: ["MG Road, Bengaluru, Karnataka 560001", "Attn: Ananya Iyer"] },
    campaignFor: "",
    campaignName: "Winter skincare launch",
    items: items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: String(i.quantity),
      rate: formatINR(i.rate),
      amount: formatINR(lineAmount(i)),
    })),
    totals,
    summaryLines: [
      { label: "Subtotal", value: formatINR(totals.subtotal) },
      { label: "CGST @ 9%", value: formatINR(totals.cgst) },
      { label: "SGST @ 9%", value: formatINR(totals.sgst) },
    ],
    totalLabel: "Total",
    totalValue: formatINR(totals.total),
    amountInWords: amountInWords(totals.total),
    tds: null,
    bank: [
      { label: "Account name", value: "Priya Sharma" },
      { label: "UPI", value: "priya@okaxis" },
    ],
    upi: { id: "priya@okaxis", name: "Priya Sharma", amount: totals.total, note: "BLY/26-27/001" },
    staticQr: null,
    notes: "Payment due within 15 days of the invoice date.",
    signature: null,
  };
}
