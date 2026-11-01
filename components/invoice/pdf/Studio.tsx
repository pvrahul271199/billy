import { Image, Text, View } from "@react-pdf/renderer";
import { pdfColors as c } from "@/lib/pdf-theme";
import { BankRows, Caps, Hairline, Identity, ItemsTable, Lines, Notes, QrBlock, SumRow, TdsBlock, type PdfSheetProps } from "./parts";

export function StudioPdf({ view, qrImage }: PdfSheetProps) {
  const [first, ...rest] = view.meta;
  return (
    <>
      <Identity view={view} size={18} tracking={4} upper />
      <Hairline style={{ marginTop: 20, marginBottom: 20 }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, letterSpacing: 1, marginBottom: 6 }}>BILLED TO:</Text>
          {view.billTo ? (
            <>
              <Text style={{ fontWeight: 500 }}>{view.billTo.name}</Text>
              <Lines lines={view.billTo.lines} />
            </>
          ) : null}
          {view.campaignFor ? <Text style={{ marginTop: 4 }}>Campaign for: {view.campaignFor}</Text> : null}
          {view.campaignName ? <Text style={{ marginTop: 4 }}>Campaign: {view.campaignName}</Text> : null}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, letterSpacing: 1 }}>INVOICE: {view.number}</Text>
          {first ? <Text style={{ marginTop: 6, color: c.secondary }}>{first.value}</Text> : null}
          {rest.map((m) => (
            <Text key={m.label} style={{ color: c.secondary }}>
              {m.label}: {m.value}
            </Text>
          ))}
        </View>
      </View>

      <Hairline style={{ marginTop: 20 }} />
      <ItemsTable view={view} head="bottom" rowLines caps labels={["Description", "Qty", "Rate", "Total"]} rowPad={8} />

      <View style={{ marginTop: 12, marginLeft: "auto", width: 260 }} wrap={false}>
        {view.summaryLines.map((l) => (
          <SumRow key={l.label} label={l.label} value={l.value} />
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6, paddingVertical: 8, borderTopWidth: 0.75, borderTopColor: c.hairline }}>
          <Text style={{ fontWeight: 500, letterSpacing: 1 }}>{view.totalLabel.toUpperCase()} DUE</Text>
          <Text style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{view.totalValue}</Text>
        </View>
        <Text style={{ fontSize: 8.5, color: c.secondary }}>{view.amountInWords}</Text>
        <TdsBlock view={view} />
      </View>

      {view.signature ? (
        <View style={{ marginTop: 24 }} wrap={false}>
          <Image src={view.signature.image} style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain", marginBottom: 4 }} />
          <Text style={{ color: c.secondary }}>{view.signature.name}, authorised signatory</Text>
        </View>
      ) : null}

      {view.bank || qrImage ? (
        <View style={{ marginTop: 24 }} wrap={false}>
          <Text style={{ fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>PAYMENT INFORMATION:</Text>
          <BankRows view={view} labelWidth={96} />
          <QrBlock view={view} qrImage={qrImage} />
        </View>
      ) : null}
      <Notes view={view} style={{ marginTop: 20 }} />

      <Hairline style={{ marginTop: 32, marginBottom: 12 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }} wrap={false}>
        <Caps size={9} tracking={2}>{view.from.name}</Caps>
        <View style={{ alignItems: "flex-end" }}>
          {view.from.instagram ? <Text>{view.from.instagram}</Text> : null}
          <Lines lines={view.from.lines} soft={false} align="right" />
        </View>
      </View>
    </>
  );
}
