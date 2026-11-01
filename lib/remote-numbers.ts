import { isSyncConfigured } from "./sync";
import { supabase } from "./supabase";

/**
 * Invoice numbers already in the cloud for one prefix and financial year
 * (`head` is like "BLY/26-27/"). Includes sent invoices that were deleted, so an
 * issued number is never reused. Returns [] when offline, signed out or slow, so
 * numbering never waits on the network.
 */
export async function remoteInvoiceNumbers(head: string, excludeId?: string): Promise<string[]> {
  if (!isSyncConfigured() || (typeof navigator !== "undefined" && !navigator.onLine)) return [];
  try {
    const sb = supabase();
    const { data: s } = await sb.auth.getSession();
    if (!s.session) return [];
    const query = sb
      .from("invoices")
      .select("id, invoice_number")
      .like("invoice_number", `${head}%`)
      .or("deleted_at.is.null,sent_at.not.is.null")
      .limit(2000)
      .then((r) => r);
    const res = await Promise.race([query, new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))]);
    if (!res || res.error || !res.data) return [];
    return res.data.filter((r) => r.id !== excludeId).map((r) => String(r.invoice_number));
  } catch {
    return [];
  }
}
