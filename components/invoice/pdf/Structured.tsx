import { Text, View } from "@react-pdf/renderer";
import { pdfColors as c } from "@/lib/pdf-theme";
import { BankRows, Hairline, ItemsTable, Lines, Notes, QrBlock, SignatureBlock, SumRow, TdsBlock, type PdfSheetProps } from "./parts";

export function StructuredPdf({ view, qrImage }: PdfSheetProps) {
  const [first, ...rest] = view.meta;
  return (
    <>
      <Text style={{ fontSize: 34, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2 }}>{view.title.toUpperCase()}</Text>
      <Text style={{ marginTop: 6, fontSize: 11 }}>INVOICE NO: {view.number}</Text>
      {first ? <Text style={{ fontSize: 11 }}>{first.value.toUpperCase()}</Text> : null}
      <Hairline ink style={{ marginVertical: 16 }} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 24 }}>
        <View style={{ flex: 1 }}>
          {rest.map((m) => (
            <View key={m.label} style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 500 }}>{m.label}:</Text>
              <Text>{m.value}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: 500, marginBottom: 4 }}>INVOICE TO</Text>
          {view.billTo ? (
            <>
              <Text style={{ fontWeight: 500 }}>{view.billTo.name}</Text>
              <Lines lines={view.billTo.lines} />
            </>
          ) : null}
          {view.campaignFor ? <Text style={{ marginTop: 4 }}>Campaign for: {view.campaignFor}</Text> : null}
          {view.campaignName ? <Text style={{ marginTop: 4 }}>Campaign: {view.campaignName}</Text> : null}
        </View>
      </View>
      <Hairline ink style={{ marginVertical: 16 }} />

      <ItemsTable view={view} head="bottom" rowLines={false} labels={["Item", "Quantity", "Price", "Total"]} rowPad={9} />
      <Hairline ink style={{ marginTop: 8 }} />

      <View style={{ marginTop: 12, marginLeft: "auto", width: 250 }} wrap={false}>
        {view.summaryLines.map((l, i) => (
          <SumRow key={l.label} label={i === 0 ? "Sub total" : l.label} value={l.value} />
        ))}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 8,
            paddingVertical: 8,
            borderTopWidth: 0.75,
            borderTopColor: c.text,
            borderBottomWidth: 0.75,
            borderBottomColor: c.text,
          }}
        >
          <Text style={{ fontSize: 10.5, fontWeight: 500 }}>{view.totalLabel} amount</Text>
          <Text style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{view.totalValue}</Text>
        </View>
        <Text style={{ marginTop: 8, fontSize: 8.5, color: c.secondary }}>{view.amountInWords}</Text>
        <TdsBlock view={view} />
      </View>

      <View style={{ flexDirection: "row", gap: 24, marginTop: 40 }} wrap={false}>
        <View style={{ flex: 1 }}>
          {view.bank || qrImage ? (
            <>
              <Text style={{ fontSize: 11, fontWeight: 500, marginBottom: 4 }}>Payment information</Text>
              <BankRows view={view} />
              <QrBlock view={view} qrImage={qrImage} />
            </>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: 500, marginBottom: 4 }}>{view.from.name}</Text>
          {view.from.instagram ? <Text>{view.from.instagram}</Text> : null}
          <Lines lines={view.from.lines} soft={false} />
        </View>
      </View>
      <Notes view={view} style={{ marginTop: 24 }} />
      <View style={{ marginTop: 24 }}>
        <SignatureBlock view={view} />
      </View>
    </>
  );
}
