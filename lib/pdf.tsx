"use client";

import type { InvoiceView } from "./invoice-view";
import { upiQrDataUrl } from "./upi";

let fontsRegistered = false;

/** Generate the invoice PDF in the browser. react-pdf is loaded on first use. */
export async function renderInvoicePdf(view: InvoiceView): Promise<Blob> {
  const [{ pdf, Font }, { InvoicePdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/invoice/InvoicePdf"),
  ]);

  if (!fontsRegistered) {
    const base = `${window.location.origin}/fonts`;
    Font.register({
      family: "Inter",
      fonts: [
        { src: `${base}/inter-latin-400.woff`, fontWeight: 400 },
        { src: `${base}/inter-latin-500.woff`, fontWeight: 500 },
      ],
    });
    Font.register({
      family: "InterExt",
      fonts: [
        { src: `${base}/inter-latin-ext-400.woff`, fontWeight: 400 },
        { src: `${base}/inter-latin-ext-500.woff`, fontWeight: 500 },
      ],
    });
    // Never hyphenate words (names, GSTINs, invoice numbers).
    Font.registerHyphenationCallback((word) => [word]);
    fontsRegistered = true;
  }

  const qr = view.upi ? await upiQrDataUrl({ upiId: view.upi.id, name: view.upi.name, amount: view.upi.amount, note: view.upi.note }) : null;
  return pdf(<InvoicePdf view={view} qr={qr} />).toBlob();
}

/** "BLY/26-27/001" → "BLY-26-27-001.pdf" */
export function pdfFileName(number: string): string {
  return `${number.replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
}
