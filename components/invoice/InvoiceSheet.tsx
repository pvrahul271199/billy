"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { InvoiceView } from "@/lib/invoice-view";
import { formatINR } from "@/lib/format";
import { upiQrDataUrl } from "@/lib/upi";

/** A4 in PDF points. The sheet is laid out at this size, then scaled to fit. */
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-1 text-[7.5px] font-medium tracking-[1px] text-print-soft">{children}</p>;
}

/**
 * On-screen invoice that mirrors components/invoice/InvoicePdf.tsx point for point.
 * If you change one, change the other.
 */
export function InvoiceSheet({ view }: { view: InvoiceView }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(A4_HEIGHT);
  const [qr, setQr] = useState<string | null>(null);

  // Regenerate the QR only when what it encodes changes.
  const upi = view.upi;
  const upiKey = upi ? [upi.id, upi.name, upi.amount, upi.note].join("|") : "";
  useEffect(() => {
    let cancelled = false;
    if (!upi) {
      setQr(null);
      return;
    }
    void upiQrDataUrl({ upiId: upi.id, name: upi.name, amount: upi.amount, note: upi.note }).then((d) => {
      if (!cancelled) setQr(d);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the encoded values
  }, [upiKey]);

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      setScale(o.clientWidth / A4_WIDTH);
      setHeight(Math.max(A4_HEIGHT, i.scrollHeight));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  const qrImage = qr ?? view.staticQr;

  return (
    <div ref={outer} className="w-full overflow-hidden rounded-[4px] border border-line bg-white" style={{ height: height * scale }}>
      <div
        ref={inner}
        className="relative origin-top-left bg-white text-[9px] leading-[1.4] text-print"
        style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, transform: `scale(${scale})`, padding: "40px 40px 56px" }}
        role="document"
        aria-label={`${view.title} ${view.number}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4">
          <div>
            {view.from.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- local data URL
              <img src={view.from.logo} alt={`${view.from.name} logo`} className="max-h-12 max-w-[150px] object-contain" />
            ) : (
              <p className="text-[14px] font-medium">{view.from.name}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[16px] font-medium tracking-[1px]">{view.title.toUpperCase()}</p>
            <p className="mt-1.5 mb-1 text-[10px] font-medium tabular">{view.number}</p>
            {view.meta.map((m) => (
              <div key={m.label} className="mt-0.5 flex">
                <span className="mr-2 w-[70px] text-right text-print-soft">{m.label}</span>
                <span className="min-w-[70px] text-right tabular">{m.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-[18px] border-b border-print" />

        {/* Parties */}
        <div className="mb-4 flex gap-6">
          <div className="flex-1">
            <Label>FROM</Label>
            <p className="mb-0.5 text-[10.5px] font-medium">{view.from.name}</p>
            {view.from.instagram ? <p>{view.from.instagram}</p> : null}
            {view.from.lines.map((l) => (
              <p key={l} className="text-print-soft">
                {l}
              </p>
            ))}
          </div>
          <div className="flex-1">
            <Label>BILL TO</Label>
            {view.billTo ? (
              <>
                <p className="mb-0.5 text-[10.5px] font-medium">{view.billTo.name}</p>
                {view.billTo.lines.map((l) => (
                  <p key={l} className="text-print-soft">
                    {l}
                  </p>
                ))}
              </>
            ) : (
              <p className="text-print-soft">No brand selected</p>
            )}
            {view.campaignFor ? <p className="mt-1">Campaign for: {view.campaignFor}</p> : null}
          </div>
        </div>

        {view.campaignName ? (
          <div className="mb-3">
            <Label>CAMPAIGN</Label>
            <p>{view.campaignName}</p>
          </div>
        ) : null}

        {/* Items */}
        <table className="mt-1 w-full border-collapse">
          <thead>
            <tr className="border-y-[0.75px] border-print text-[8px]">
              <th scope="col" className="px-2 py-1.5 text-left font-medium">Description</th>
              <th scope="col" className="w-10 px-2 py-1.5 text-right font-medium">Qty</th>
              <th scope="col" className="w-20 px-2 py-1.5 text-right font-medium">Rate</th>
              <th scope="col" className="w-[90px] px-2 py-1.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {view.items.length ? (
              view.items.map((i) => (
                <tr key={i.id} className="border-b-[0.75px] border-print-line">
                  <td className="px-2 py-[7px]">{i.description || <span className="text-print-soft">No description</span>}</td>
                  <td className="px-2 py-[7px] text-right tabular">{i.quantity}</td>
                  <td className="px-2 py-[7px] text-right tabular">{i.rate}</td>
                  <td className="px-2 py-[7px] text-right tabular">{i.amount}</td>
                </tr>
              ))
            ) : (
              <tr className="border-b-[0.75px] border-print-line">
                <td colSpan={4} className="px-2 py-[7px] text-print-soft">
                  No items yet
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Payment + totals */}
        <div className="mt-2.5 flex items-start justify-between gap-6">
          <div className="flex-1 pt-1.5">
            {view.bank || qrImage ? (
              <>
                <Label>PAYMENT DETAILS</Label>
                {(view.bank ?? []).map((r) => (
                  <div key={r.label} className="mb-0.5 flex">
                    <span className="w-[78px] shrink-0 text-print-soft">{r.label}</span>
                    <span className="flex-1 break-all tabular">{r.value}</span>
                  </div>
                ))}
                {qrImage ? (
                  <div className="mt-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                    <img src={qrImage} alt="UPI payment QR code" className="h-24 w-24" />
                    <p className="mt-1 text-[7.5px] text-print-soft">
                      {view.upi ? `Scan to pay ${formatINR(view.upi.amount)} via UPI` : "Scan to pay via UPI"}
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
          <div className="w-[240px]">
            {view.summaryLines.map((l) => (
              <div key={l.label} className="flex justify-between px-2 py-[3px]">
                <span className="text-print-soft">{l.label}</span>
                <span className="tabular">{l.value}</span>
              </div>
            ))}
            <div className="mt-1 flex items-end justify-between border-t border-print px-2 py-2">
              <span className="text-[11px] font-medium">{view.totalLabel}</span>
              <span className="text-[20px] leading-none font-medium tabular">{view.totalValue}</span>
            </div>
            <p className="mt-2 px-2 text-[8.5px] text-print-soft">{view.amountInWords}</p>
            {view.tds ? (
              <div className="mt-2.5 border-t-[0.75px] border-print-line pt-1.5">
                <div className="flex justify-between px-2 py-[3px]">
                  <span className="text-print-soft">{view.tds.label}</span>
                  <span className="tabular">{view.tds.value}</span>
                </div>
                <div className="flex justify-between px-2 py-[3px] font-medium">
                  <span>{view.tds.netLabel}</span>
                  <span className="tabular">{view.tds.netValue}</span>
                </div>
                <p className="mt-1 px-2 text-[7.5px] text-print-soft">
                  TDS is shown for reference only and doesn&apos;t change the invoice total.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {view.notes ? (
          <div className="mt-[22px]">
            <Label>NOTES AND TERMS</Label>
            <p className="whitespace-pre-line">{view.notes}</p>
          </div>
        ) : null}

        {view.signature ? (
          <div className="mt-6 flex flex-col items-end">
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
            <img src={view.signature.image} alt={`Signature of ${view.signature.name}`} className="mb-1 max-h-12 max-w-40 object-contain" />
            <p className="font-medium">{view.signature.name}</p>
            <p className="text-print-soft">Authorised signatory</p>
          </div>
        ) : null}

      </div>
    </div>
  );
}
