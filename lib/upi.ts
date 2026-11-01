import type { Paise } from "@/types";
import { colors } from "@/theme/tokens";

export interface UpiParams {
  /** Payee UPI ID, e.g. riya@okhdfcbank */
  upiId: string;
  /** Payee name */
  name: string;
  amount: Paise;
  /** Transaction note: the invoice number */
  note: string;
}

/** upi://pay?pa=<upi>&pn=<name>&am=<total>&cu=INR&tn=<invoice number> */
export function buildUpiLink({ upiId, name, amount, note }: UpiParams): string {
  const params = [
    ["pa", upiId.trim()],
    ["pn", name.trim()],
    ["am", (Math.round(amount) / 100).toFixed(2)],
    ["cu", "INR"],
    ["tn", note.trim()],
  ];
  return `upi://pay?${params.map(([k, v]) => `${k}=${encodeURIComponent(v ?? "")}`).join("&")}`;
}

/** UPI link → QR code PNG data URL. Loaded lazily to keep the main bundle small. */
export async function upiQrDataUrl(params: UpiParams): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(buildUpiLink(params), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: { dark: colors.ink, light: colors.bg },
  });
}
