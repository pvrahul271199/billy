import { Text, View } from "@react-pdf/renderer";
import { pdfColors as c } from "@/lib/pdf-theme";
import { BankRows, Hairline, Identity, ItemsTable, Lines, Notes, QrBlock, SignatureBlock, SumRow, TdsBlock, type PdfSheetProps } from "./parts";

export function StatementPdf({ view, qrImage }: PdfSheetProps) {
  return (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text style={{ fontSize: 30, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2 }}>{view.title}</Text>
          <Text style={{ marginTop: 6, fontSize: 11, fontWeight: 500 }}>{view.number}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Identity view={view} size={12} />
          {view.from.instagram ? <Text style={{ color: c.secondary }}>{view.from.instagram}</Text> : null}
        </View>
      </View>
      <Hairline style={{ marginVertical: 16 }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 500, marginBottom: 2 }}>Bill to</Text>
          {view.billTo ? (
            <>
              <Text style={{ fontSize: 10.5, fontWeight: 500 }}>{view.billTo.name}</Text>
              <Lines lines={view.billTo.lines} />
            </>
          ) : null}
          {view.campaignFor ? <Text style={{ marginTop: 4 }}>Campaign for: {view.campaignFor}</Text> : null}
        </View>
        <View style={{ width: 200 }}>
          {view.meta.map((m) => (
            <Text key={m.label} style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 500 }}>{m.label}: </Text>
              {m.value}
            </Text>
          ))}
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: 500, marginBottom: 2 }}>From</Text>
        <Text style={{ fontSize: 10.5, fontWeight: 500 }}>{view.from.name}</Text>
        <Lines lines={view.from.lines} />
      </View>
      {view.campaignName ? <Text style={{ marginTop: 12 }}>Campaign: {view.campaignName}</Text> : null}

      <View style={{ marginTop: 20, paddingVertical: 6, borderTopWidth: 0.75, borderTopColor: c.text, borderBottomWidth: 0.75, borderBottomColor: c.text }}>
        <Text style={{ textAlign: "center", fontSize: 8.5, fontWeight: 500, letterSpacing: 2 }}>SERVICES PROVIDED</Text>
      </View>
      <ItemsTable view={view} head="bottom" rowLines />

      <View style={{ marginTop: 24, width: 260 }} wrap={false}>
        <Text style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Summary</Text>
        {view.summaryLines.map((l) => (
          <SumRow key={l.label} label={l.label} value={l.value} />
        ))}
        <SumRow label={view.totalLabel} value={view.totalValue} strong />
        <Text style={{ marginTop: 6, fontSize: 8.5, color: c.secondary }}>{view.amountInWords}</Text>
        <TdsBlock view={view} />
      </View>

      <Hairline ink style={{ marginTop: 24 }} />
      <View style={{ flexDirection: "row", gap: 24, marginTop: 12 }} wrap={false}>
        <View style={{ flex: 1 }}>
          {view.bank || qrImage ? (
            <>
              <Text style={{ fontWeight: 500, marginBottom: 4 }}>Payment information</Text>
              <BankRows view={view} />
              <QrBlock view={view} qrImage={qrImage} />
            </>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Notes view={view} />
          <View style={{ marginTop: 16 }}>
            <SignatureBlock view={view} align="start" />
          </View>
        </View>
      </View>
    </>
  );
}
