import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InvoiceView } from "@/lib/invoice-view";
import { pdfColors as c } from "@/lib/pdf-theme";
import type { InvoiceTemplateId } from "@/types";
import { ClassicPdf } from "./pdf/Classic";
import type { PdfSheetProps } from "./pdf/parts";
import { SignaturePdf } from "./pdf/Signature";
import { StatementPdf } from "./pdf/Statement";
import { StructuredPdf } from "./pdf/Structured";
import { StudioPdf } from "./pdf/Studio";

/** Inter for text, with Inter latin-ext as fallback for the ₹ glyph. */
export const PDF_FONT = ["Inter", "InterExt"];

const LAYOUTS: Record<InvoiceTemplateId, (p: PdfSheetProps) => React.ReactNode> = {
  classic: ClassicPdf,
  statement: StatementPdf,
  signature: SignaturePdf,
  structured: StructuredPdf,
  studio: StudioPdf,
};

const s = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT as unknown as string,
    fontSize: 9,
    color: c.text,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: c.secondary,
  },
});

/** PDF twin of components/invoice/InvoiceSheet.tsx. Each template has a layout in ./pdf and ./sheet; change both together. */
export function InvoicePdf({ view, qr }: { view: InvoiceView; qr: string | null }) {
  const qrImage = qr ?? view.staticQr;
  const Layout = LAYOUTS[view.template] ?? ClassicPdf;
  return (
    <Document title={`${view.title} ${view.number}`} author={view.from.name} creator="Billy" producer="Billy">
      <Page size="A4" style={s.page}>
        <Layout view={view} qrImage={qrImage} />
        <View style={s.footer} fixed>
          <Text />
          <Text render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "")} />
        </View>
      </Page>
    </Document>
  );
}
