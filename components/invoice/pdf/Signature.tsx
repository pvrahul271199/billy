import { Text, View } from "@react-pdf/renderer";
import { pdfColors as c } from "@/lib/pdf-theme";
import { BankRows, Caps, Hairline, Identity, ItemsTable, Lines, Notes, QrBlock, SignatureBlock, TdsBlock, type PdfSheetProps } from "./parts";

export function SignaturePdf({ view, qrImage }: PdfSheetProps) {
  const extra = view.summaryLines.slice(1);
  return (
    <>
      <View style={{ alignItems: "center" }}>
        <Identity view={view} size={24} tracking={1} align="center" />
        {view.from.instagram ? (
          <Text style={{ marginTop: 10, fontSize: 8.5, letterSpacing: 3, color: c.secondary }}>{view.from.instagram.toUpperCase()}</Text>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 24, marginTop: 48 }}>
        <View style={{ flex: 1 }}>
          <Caps bold style={{ marginBottom: 6 }}>Issued to:</Caps>
          {view.billTo ? (
            <>
              <Text style={{ fontSize: 10 }}>{view.billTo.name}</Text>
              <Lines lines={view.billTo.lines} />
            </>
          ) : null}
          {view.campaignFor ? <Text style={{ marginTop: 4 }}>Campaign for: {view.campaignFor}</Text> : null}
          {view.campaignName ? <Text style={{ marginTop: 4 }}>Campaign: {view.campaignName}</Text> : null}
        </View>
        <View style={{ width: 190 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Caps bold style={{ marginBottom: 0 }}>Invoice no:</Caps>
            <Text>{view.number}</Text>
          </View>
          {view.meta.map((m) => (
            <View key={m.label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Caps bold style={{ marginBottom: 0 }}>{m.label + ":"}</Caps>
              <Text>{m.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 40 }}>
        <ItemsTable view={view} head="bottom" rowLines={false} caps labels={["Description", "Qty", "Unit price", "Total"]} rowPad={6} />
      </View>
      <Hairline ink style={{ marginTop: 4 }} />

      <View style={{ marginTop: 8, marginLeft: "auto", width: 250 }} wrap={false}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
          <Caps bold style={{ marginBottom: 0 }}>Subtotal</Caps>
          <Text style={{ fontWeight: 500 }}>{view.summaryLines[0]?.value}</Text>
        </View>
        {extra.map((l) => (
          <View key={l.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
            <Text style={{ color: c.secondary }}>{l.label}</Text>
            <Text style={{ color: c.secondary }}>{l.value}</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 }}>
          <Caps bold style={{ marginBottom: 0 }}>{view.totalLabel}</Caps>
          <Text style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.2 }}>{view.totalValue}</Text>
        </View>
        <Text style={{ marginTop: 8, fontSize: 8.5, color: c.secondary }}>{view.amountInWords}</Text>
        <TdsBlock view={view} />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginTop: 40 }} wrap={false}>
        <View style={{ flex: 1 }}>
          {view.bank || qrImage ? (
            <>
              <Caps bold style={{ marginBottom: 6 }}>Pay to:</Caps>
              <BankRows view={view} />
              <QrBlock view={view} qrImage={qrImage} />
            </>
          ) : null}
        </View>
        <SignatureBlock view={view} />
      </View>
      <Notes view={view} style={{ marginTop: 24 }} />
    </>
  );
}
