import type { ReactNode } from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";

type Style = ComponentProps<typeof View>["style"];
import type { InvoiceView } from "@/lib/invoice-view";
import { pdfColors as c } from "@/lib/pdf-theme";
import { formatINR } from "@/lib/format";

export interface PdfSheetProps {
  view: InvoiceView;
  qrImage: string | null;
}

/** Small spaced caption, as used for section labels. */
export function Caps({ children, soft = false, bold = false, size = 7.5, tracking = 1.2, style }: { children: ReactNode; soft?: boolean; bold?: boolean; size?: number; tracking?: number; style?: Style }) {
  return (
    <Text style={[{ fontSize: size, letterSpacing: tracking, fontWeight: bold ? 500 : 500, color: soft ? c.secondary : c.text, marginBottom: 4 }, style ?? {}]}>
      {typeof children === "string" ? children.toUpperCase() : children}
    </Text>
  );
}

export function Identity({ view, size = 14, tracking = 0, upper = false, align }: { view: InvoiceView; size?: number; tracking?: number; upper?: boolean; align?: "center" | "right" }) {
  if (view.from.logo) return <Image src={view.from.logo} style={{ maxHeight: 48, maxWidth: 150, objectFit: "contain" }} />;
  return (
    <Text style={{ fontSize: size, fontWeight: size > 16 ? 400 : 500, letterSpacing: tracking, textAlign: align, lineHeight: size > 16 ? 1.25 : 1.4 }}>
      {upper ? view.from.name.toUpperCase() : view.from.name}
    </Text>
  );
}

export function Lines({ lines, soft = true, align }: { lines: string[]; soft?: boolean; align?: "right" }) {
  return (
    <>
      {lines.map((l) => (
        <Text key={l} style={{ color: soft ? c.secondary : c.text, textAlign: align }}>
          {l}
        </Text>
      ))}
    </>
  );
}

export function Hairline({ ink = false, style }: { ink?: boolean; style?: Style }) {
  return <View style={[{ borderBottomWidth: 0.75, borderBottomColor: ink ? c.text : c.hairline }, style ?? {}]} />;
}

const col = {
  desc: { flex: 1, paddingRight: 8 },
  qty: { width: 40, textAlign: "right" as const },
  rate: { width: 80, textAlign: "right" as const },
  amt: { width: 90, textAlign: "right" as const },
};

export function ItemsTable({
  view,
  head,
  rowLines,
  caps = false,
  labels = ["Description", "Qty", "Rate", "Amount"],
  rowPad = 7,
}: {
  view: InvoiceView;
  head: "both" | "bottom";
  rowLines: boolean;
  caps?: boolean;
  labels?: [string, string, string, string];
  rowPad?: number;
}) {
  const cols = [col.desc, col.qty, col.rate, col.amt];
  const headBorder =
    head === "both"
      ? { borderTopWidth: 0.75, borderTopColor: c.text, borderBottomWidth: 0.75, borderBottomColor: c.text }
      : { borderBottomWidth: 0.75, borderBottomColor: c.text };
  return (
    <View style={{ marginTop: 4 }}>
      <View style={[{ flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8 }, headBorder]} fixed>
        {labels.map((l, i) => (
          <Text key={l} style={[{ fontWeight: 500, fontSize: 8, letterSpacing: caps ? 1 : 0 }, cols[i]!]}>
            {caps ? l.toUpperCase() : l}
          </Text>
        ))}
      </View>
      {view.items.map((it) => (
        <View
          key={it.id}
          style={{ flexDirection: "row", paddingVertical: rowPad, paddingHorizontal: 8, ...(rowLines ? { borderBottomWidth: 0.75, borderBottomColor: c.hairline } : {}) }}
          wrap={false}
        >
          <Text style={col.desc}>{it.description}</Text>
          <Text style={col.qty}>{it.quantity}</Text>
          <Text style={col.rate}>{it.rate}</Text>
          <Text style={col.amt}>{it.amount}</Text>
        </View>
      ))}
    </View>
  );
}

export function BankRows({ view, labelWidth = 78 }: { view: InvoiceView; labelWidth?: number }) {
  return (
    <>
      {(view.bank ?? []).map((r) => (
        <View key={r.label} style={{ flexDirection: "row", marginBottom: 2 }}>
          <Text style={{ width: labelWidth, color: c.secondary }}>{r.label}</Text>
          <Text style={{ flex: 1 }}>{r.value}</Text>
        </View>
      ))}
    </>
  );
}

export function QrBlock({ view, qrImage }: PdfSheetProps) {
  if (!qrImage) return null;
  return (
    <View style={{ alignItems: "flex-start", marginTop: 10 }}>
      <Image src={qrImage} style={{ width: 96, height: 96 }} />
      <Text style={{ fontSize: 7.5, color: c.secondary, marginTop: 4 }}>
        {view.upi ? `Scan to pay ${formatINR(view.upi.amount)} via UPI` : "Scan to pay via UPI"}
      </Text>
    </View>
  );
}

export function SumRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
      <Text style={{ color: strong ? c.text : c.secondary, fontWeight: strong ? 500 : 400 }}>{label}</Text>
      <Text style={{ fontWeight: strong ? 500 : 400 }}>{value}</Text>
    </View>
  );
}

export function TdsBlock({ view }: { view: InvoiceView }) {
  if (!view.tds) return null;
  return (
    <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 0.75, borderTopColor: c.hairline }}>
      <SumRow label={view.tds.label} value={view.tds.value} />
      <SumRow label={view.tds.netLabel} value={view.tds.netValue} strong />
      <Text style={{ marginTop: 4, fontSize: 7.5, color: c.secondary }}>TDS is shown for reference only and doesn&apos;t change the invoice total.</Text>
    </View>
  );
}

export function SignatureBlock({ view, align = "end" }: { view: InvoiceView; align?: "start" | "end" }) {
  if (!view.signature) return null;
  return (
    <View style={{ alignItems: align === "end" ? "flex-end" : "flex-start" }} wrap={false}>
      <Image src={view.signature.image} style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain", marginBottom: 4 }} />
      <Text style={{ fontWeight: 500 }}>{view.signature.name}</Text>
      <Text style={{ color: c.secondary }}>Authorised signatory</Text>
    </View>
  );
}

export function Notes({ view, style }: { view: InvoiceView; style?: Style }) {
  if (!view.notes) return null;
  return (
    <View style={style} wrap={false}>
      <Caps soft>Notes and terms</Caps>
      <Text>{view.notes}</Text>
    </View>
  );
}
