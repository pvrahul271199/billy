"use client";

import type { CSSProperties, ReactNode } from "react";
import type { InvoiceView } from "@/lib/invoice-view";
import { formatINR } from "@/lib/format";

export interface SheetProps {
  view: InvoiceView;
  qrImage: string | null;
}

const INK = "var(--print)";
const HAIRLINE = "var(--print-line)";

/** Small spaced caption, as used for section labels. */
export function Caps({ children, className = "", soft = false }: { children: ReactNode; className?: string; soft?: boolean }) {
  return (
    <p className={`text-[7.5px] font-medium tracking-[1.2px] uppercase ${soft ? "text-print-soft" : ""} ${className}`}>{children}</p>
  );
}

/** Logo if there is one, otherwise the creator's name. */
export function Identity({ view, className = "text-[14px] font-medium" }: { view: InvoiceView; className?: string }) {
  return view.from.logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- local data URL
    <img src={view.from.logo} alt={`${view.from.name} logo`} className="max-h-12 max-w-[150px] object-contain" />
  ) : (
    <p className={className}>{view.from.name}</p>
  );
}

export function Lines({ lines, className = "text-print-soft" }: { lines: string[]; className?: string }) {
  return (
    <>
      {lines.map((l) => (
        <p key={l} className={className}>
          {l}
        </p>
      ))}
    </>
  );
}

export function Hairline({ ink = false, className = "" }: { ink?: boolean; className?: string }) {
  return <div className={className} style={{ borderBottom: `0.75px solid ${ink ? INK : HAIRLINE}` }} />;
}

interface TableProps {
  view: InvoiceView;
  /** Rules around the header row. */
  head: "both" | "bottom";
  /** Hairline under every row. */
  rowLines: boolean;
  caps?: boolean;
  labels?: [string, string, string, string];
  rowPad?: number;
}

export function ItemsTable({ view, head, rowLines, caps = false, labels = ["Description", "Qty", "Rate", "Amount"], rowPad = 7 }: TableProps) {
  const headStyle: CSSProperties =
    head === "both" ? { borderTop: `0.75px solid ${INK}`, borderBottom: `0.75px solid ${INK}` } : { borderBottom: `0.75px solid ${INK}` };
  const rowStyle: CSSProperties = rowLines ? { borderBottom: `0.75px solid ${HAIRLINE}` } : {};
  const pad = { paddingTop: rowPad, paddingBottom: rowPad };
  const th = `px-2 py-1.5 font-medium text-[8px] ${caps ? "tracking-[1px] uppercase" : ""}`;
  return (
    <table className="mt-1 w-full border-collapse">
      <thead>
        <tr style={headStyle}>
          <th scope="col" className={`${th} text-left`}>{labels[0]}</th>
          <th scope="col" className={`${th} w-10 text-right`}>{labels[1]}</th>
          <th scope="col" className={`${th} w-20 text-right`}>{labels[2]}</th>
          <th scope="col" className={`${th} w-[90px] text-right`}>{labels[3]}</th>
        </tr>
      </thead>
      <tbody>
        {view.items.length ? (
          view.items.map((i) => (
            <tr key={i.id} style={rowStyle}>
              <td className="px-2" style={pad}>{i.description || <span className="text-print-soft">No description</span>}</td>
              <td className="px-2 text-right tabular" style={pad}>{i.quantity}</td>
              <td className="px-2 text-right tabular" style={pad}>{i.rate}</td>
              <td className="px-2 text-right tabular" style={pad}>{i.amount}</td>
            </tr>
          ))
        ) : (
          <tr style={rowStyle}>
            <td colSpan={4} className="px-2 text-print-soft" style={pad}>No items yet</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function BankRows({ view, labelWidth = 78 }: { view: InvoiceView; labelWidth?: number }) {
  return (
    <>
      {(view.bank ?? []).map((r) => (
        <div key={r.label} className="mb-0.5 flex">
          <span className="shrink-0 text-print-soft" style={{ width: labelWidth }}>{r.label}</span>
          <span className="flex-1 break-all tabular">{r.value}</span>
        </div>
      ))}
    </>
  );
}

export function QrBlock({ view, qrImage }: SheetProps) {
  if (!qrImage) return null;
  return (
    <div className="mt-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
      <img src={qrImage} alt="UPI payment QR code" className="h-24 w-24" />
      <p className="mt-1 text-[7.5px] text-print-soft">
        {view.upi ? `Scan to pay ${formatINR(view.upi.amount)} via UPI` : "Scan to pay via UPI"}
      </p>
    </div>
  );
}

export function TdsBlock({ view }: { view: InvoiceView }) {
  if (!view.tds) return null;
  return (
    <div className="mt-2.5 pt-1.5" style={{ borderTop: `0.75px solid ${HAIRLINE}` }}>
      <div className="flex justify-between py-[3px]">
        <span className="text-print-soft">{view.tds.label}</span>
        <span className="tabular">{view.tds.value}</span>
      </div>
      <div className="flex justify-between py-[3px] font-medium">
        <span>{view.tds.netLabel}</span>
        <span className="tabular">{view.tds.netValue}</span>
      </div>
      <p className="mt-1 text-[7.5px] text-print-soft">TDS is shown for reference only and doesn&apos;t change the invoice total.</p>
    </div>
  );
}

export function SignatureBlock({ view, align = "end" }: { view: InvoiceView; align?: "start" | "end" }) {
  if (!view.signature) return null;
  return (
    <div className={`flex flex-col ${align === "end" ? "items-end" : "items-start"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
      <img src={view.signature.image} alt={`Signature of ${view.signature.name}`} className="mb-1 max-h-12 max-w-40 object-contain" />
      <p className="font-medium">{view.signature.name}</p>
      <p className="text-print-soft">Authorised signatory</p>
    </div>
  );
}

export function SumRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-[3px] ${strong ? "font-medium" : ""}`}>
      <span className={strong ? "" : "text-print-soft"}>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

export function Notes({ view, className = "" }: { view: InvoiceView; className?: string }) {
  if (!view.notes) return null;
  return (
    <div className={className}>
      <Caps soft className="mb-1">Notes and terms</Caps>
      <p className="whitespace-pre-line">{view.notes}</p>
    </div>
  );
}
