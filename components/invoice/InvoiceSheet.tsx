"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { InvoiceView } from "@/lib/invoice-view";
import type { InvoiceTemplateId } from "@/types";
import { upiQrDataUrl } from "@/lib/upi";
import { ClassicSheet } from "./sheet/Classic";
import type { SheetProps } from "./sheet/parts";
import { SignatureSheet } from "./sheet/Signature";
import { StatementSheet } from "./sheet/Statement";
import { StructuredSheet } from "./sheet/Structured";
import { StudioSheet } from "./sheet/Studio";

const LAYOUTS: Record<InvoiceTemplateId, (p: SheetProps) => React.ReactNode> = {
  classic: ClassicSheet,
  statement: StatementSheet,
  signature: SignatureSheet,
  structured: StructuredSheet,
  studio: StudioSheet,
};

/** A4 in PDF points. The sheet is laid out at this size, then scaled to fit. */
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

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
  const Layout = LAYOUTS[view.template] ?? ClassicSheet;

  return (
    <div ref={outer} className="w-full overflow-hidden rounded-[4px] border border-line bg-white" style={{ height: height * scale }}>
      <div
        ref={inner}
        className="relative origin-top-left bg-white text-[9px] leading-[1.4] text-print"
        style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, transform: `scale(${scale})`, padding: "40px 40px 56px" }}
        role="document"
        aria-label={`${view.title} ${view.number}`}
      >
        <Layout view={view} qrImage={qrImage} />
      </div>
    </div>
  );
}
