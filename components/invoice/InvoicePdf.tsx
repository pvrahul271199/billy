import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { InvoiceView } from "@/lib/invoice-view";
import { pdfColors as c } from "@/lib/pdf-theme";
import { formatINR } from "@/lib/format";

/** Inter for text, with Inter latin-ext as fallback for the ₹ glyph. */
export const PDF_FONT = ["Inter", "InterExt"];

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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16 },
  logo: { maxHeight: 48, maxWidth: 150, objectFit: "contain" },
  brandName: { fontSize: 14, fontWeight: 500 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 16, fontWeight: 500, letterSpacing: 1 },
  number: { fontSize: 10, fontWeight: 500, marginTop: 6, marginBottom: 4 },
  metaRow: { flexDirection: "row", marginTop: 2 },
  metaLabel: { color: c.secondary, width: 70, textAlign: "right", marginRight: 8 },
  metaValue: { minWidth: 70, textAlign: "right" },
  rule: { borderBottomWidth: 1, borderBottomColor: c.text, marginBottom: 18 },
  parties: { flexDirection: "row", gap: 24, marginBottom: 16 },
  partyCol: { flex: 1 },
  label: { fontSize: 7.5, color: c.secondary, letterSpacing: 1, marginBottom: 4, fontWeight: 500 },
  partyName: { fontSize: 10.5, fontWeight: 500, marginBottom: 2 },
  muted: { color: c.secondary },
  campaign: { flexDirection: "row", gap: 24, marginBottom: 16 },
  table: { marginTop: 4 },
  thead: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderTopWidth: 0.75, borderTopColor: c.text, borderBottomWidth: 0.75, borderBottomColor: c.text },
  th: { fontWeight: 500, fontSize: 8, color: c.text },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 0.75, borderBottomColor: c.hairline },
  colDesc: { flex: 1, paddingRight: 8 },
  colQty: { width: 40, textAlign: "right" },
  colRate: { width: 80, textAlign: "right" },
  colAmt: { width: 90, textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginTop: 10 },
  payCol: { flex: 1, paddingTop: 6 },
  totals: { width: 240 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 8 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: c.text,
    marginTop: 4,
  },
  totalLabel: { fontSize: 11, fontWeight: 500 },
  totalValue: { fontSize: 20, fontWeight: 500 },
  words: { marginTop: 8, paddingHorizontal: 8, fontSize: 8.5, color: c.secondary },
  tdsBox: { marginTop: 10, paddingTop: 6, borderTopWidth: 0.75, borderTopColor: c.hairline },
  tdsNote: { paddingHorizontal: 8, marginTop: 4, fontSize: 7.5, color: c.secondary },
  section: { marginTop: 22 },
    bankRow: { flexDirection: "row", marginBottom: 2 },
  bankLabel: { width: 78, color: c.secondary },
  qrBox: { alignItems: "flex-start", marginTop: 10 },
  qr: { width: 96, height: 96 },
  qrCaption: { fontSize: 7.5, color: c.secondary, marginTop: 4 },
  notes: { color: c.text },
  signBlock: { alignItems: "flex-end", marginTop: 24 },
  signature: { maxHeight: 48, maxWidth: 160, objectFit: "contain", marginBottom: 4 },
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

export function InvoicePdf({ view, qr }: { view: InvoiceView; qr: string | null }) {
  const qrImage = qr ?? view.staticQr;
  return (
    <Document title={`${view.title} ${view.number}`} author={view.from.name} creator="Billy" producer="Billy">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            {view.from.logo ? <Image src={view.from.logo} style={s.logo} /> : <Text style={s.brandName}>{view.from.name}</Text>}
          </View>
          <View style={s.titleBlock}>
            <Text style={s.title}>{view.title.toUpperCase()}</Text>
            <Text style={s.number}>{view.number}</Text>
            {view.meta.map((m) => (
              <View key={m.label} style={s.metaRow}>
                <Text style={s.metaLabel}>{m.label}</Text>
                <Text style={s.metaValue}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.rule} />

        <View style={s.parties}>
          <View style={s.partyCol}>
            <Text style={s.label}>FROM</Text>
            <Text style={s.partyName}>{view.from.name}</Text>
            {view.from.instagram ? <Text>{view.from.instagram}</Text> : null}
            {view.from.lines.map((l) => (
              <Text key={l} style={s.muted}>
                {l}
              </Text>
            ))}
          </View>
          <View style={s.partyCol}>
            <Text style={s.label}>BILL TO</Text>
            {view.billTo ? (
              <>
                <Text style={s.partyName}>{view.billTo.name}</Text>
                {view.billTo.lines.map((l) => (
                  <Text key={l} style={s.muted}>
                    {l}
                  </Text>
                ))}
              </>
            ) : null}
            {view.campaignFor ? <Text style={{ marginTop: 4 }}>Campaign for: {view.campaignFor}</Text> : null}
          </View>
        </View>

        {view.campaignName ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={s.label}>CAMPAIGN</Text>
            <Text>{view.campaignName}</Text>
          </View>
        ) : null}

        <View style={s.table}>
          <View style={s.thead} fixed>
            <Text style={[s.th, s.colDesc]}>Description</Text>
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colRate]}>Rate</Text>
            <Text style={[s.th, s.colAmt]}>Amount</Text>
          </View>
          {view.items.map((i) => (
            <View key={i.id} style={s.tr} wrap={false}>
              <Text style={s.colDesc}>{i.description}</Text>
              <Text style={s.colQty}>{i.quantity}</Text>
              <Text style={s.colRate}>{i.rate}</Text>
              <Text style={s.colAmt}>{i.amount}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsWrap} wrap={false}>
          <View style={s.payCol}>
            {view.bank || qrImage ? (
              <>
                <Text style={s.label}>PAYMENT DETAILS</Text>
                {(view.bank ?? []).map((r) => (
                  <View key={r.label} style={s.bankRow}>
                    <Text style={s.bankLabel}>{r.label}</Text>
                    <Text style={{ flex: 1 }}>{r.value}</Text>
                  </View>
                ))}
                {qrImage ? (
                  <View style={s.qrBox}>
                    <Image src={qrImage} style={s.qr} />
                    <Text style={s.qrCaption}>
                      {view.upi ? `Scan to pay ${formatINR(view.upi.amount)} via UPI` : "Scan to pay via UPI"}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
          <View style={s.totals}>
            {view.summaryLines.map((l) => (
              <View key={l.label} style={s.sumRow}>
                <Text style={s.muted}>{l.label}</Text>
                <Text>{l.value}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{view.totalLabel}</Text>
              <Text style={s.totalValue}>{view.totalValue}</Text>
            </View>
            <Text style={s.words}>{view.amountInWords}</Text>
            {view.tds ? (
              <View style={s.tdsBox}>
                <View style={s.sumRow}>
                  <Text style={s.muted}>{view.tds.label}</Text>
                  <Text>{view.tds.value}</Text>
                </View>
                <View style={s.sumRow}>
                  <Text style={{ fontWeight: 500 }}>{view.tds.netLabel}</Text>
                  <Text style={{ fontWeight: 500 }}>{view.tds.netValue}</Text>
                </View>
                <Text style={s.tdsNote}>TDS is shown for reference only and doesn&apos;t change the invoice total.</Text>
              </View>
            ) : null}
          </View>
        </View>

        {view.notes ? (
          <View style={s.section} wrap={false}>
            <Text style={s.label}>NOTES AND TERMS</Text>
            <Text style={s.notes}>{view.notes}</Text>
          </View>
        ) : null}

        {view.signature ? (
          <View style={s.signBlock} wrap={false}>
            <Image src={view.signature.image} style={s.signature} />
            <Text style={{ fontWeight: 500 }}>{view.signature.name}</Text>
            <Text style={s.muted}>Authorised signatory</Text>
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text />
          <Text render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "")} />
        </View>
      </Page>
    </Document>
  );
}
