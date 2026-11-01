/**
 * Background sync with Supabase (phase 6, not yet connected).
 *
 * The device stays the source of truth: screens read Dexie through
 * useLiveQuery and never wait on the network. Sync pushes and pulls rows in
 * the background using last-write-wins on `updated_at`.
 *
 * This module holds the pure mapping between Dexie records (camelCase,
 * nested address, items embedded, money in paise) and the rows in
 * supabase/schema.sql (snake_case, flat address, invoice_items table,
 * money in rupees). Blank strings become NULL so the schema's format checks pass.
 */
import type { Address, Invoice, LineItem, Party, PaymentDetails, Preset, Profile } from "@/types";
import { amountInWords } from "./amount-in-words";
import { DEFAULT_TEMPLATE, isTemplateId } from "./invoice-templates";
import { computeTotals } from "./tax";

type Row = Record<string, unknown>;

/** Publishable (anon) key. Either env name works. */
export function supabaseKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/** True once the Supabase URL and publishable key are set in .env.local. */
export function isSyncConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseKey());
}

const blank = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);
const rupees = (paise: number | null | undefined): number | null => (paise === null || paise === undefined ? null : Math.round(paise) / 100);
const paise = (r: unknown): number => Math.round(Number(r ?? 0) * 100);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function addressToRow(a: Address): Row {
  return {
    address_line1: blank(a.line1),
    address_line2: blank(a.line2),
    city: blank(a.city),
    state_code: blank(a.stateCode),
    pin: blank(a.pin),
  };
}

function addressFromRow(r: Row): Address {
  return { line1: str(r.address_line1), line2: str(r.address_line2), city: str(r.city), stateCode: str(r.state_code), pin: str(r.pin) };
}

/** Images stay local for now; upload to the creator-assets bucket sets the *_path columns separately. */
export function profileToRow(p: Profile, userId: string): Row {
  return {
    id: userId,
    full_name: blank(p.fullName),
    instagram_username: blank(p.instagram),
    email: blank(p.email),
    phone: blank(p.phone),
    pan: blank(p.pan),
    ...addressToRow(p.address),
    gst_registered: p.gstRegistered,
    gstin: blank(p.gstin),
    default_sac: blank(p.defaultSac),
    default_tds_rate: p.defaultTdsRate,
    invoice_prefix: p.invoicePrefix,
    default_notes: blank(p.defaultNotes),
    invoice_template: p.invoiceTemplate,
    onboarded_at: p.onboardedAt,
    updated_at: p.updatedAt,
  };
}

/** Remote row → profile. Images are filled in separately from storage. */
export function profileFromRow(r: Row, images: Pick<Profile, "photo" | "logo" | "signature">): Profile {
  return {
    id: "me",
    fullName: str(r.full_name),
    instagram: str(r.instagram_username),
    email: str(r.email),
    phone: str(r.phone),
    pan: str(r.pan),
    address: addressFromRow(r),
    ...images,
    gstRegistered: !!r.gst_registered,
    gstin: str(r.gstin),
    defaultSac: str(r.default_sac),
    defaultTdsRate: r.default_tds_rate === null || r.default_tds_rate === undefined ? null : Number(r.default_tds_rate),
    invoicePrefix: str(r.invoice_prefix) || "BLY",
    defaultNotes: str(r.default_notes),
    invoiceTemplate: isTemplateId(r.invoice_template) ? r.invoice_template : DEFAULT_TEMPLATE,
    onboardedAt: (r.onboarded_at as string | null) ?? null,
    updatedAt: str(r.updated_at),
  };
}

export function paymentFromRow(r: Row, staticQr: string | null): PaymentDetails {
  return {
    id: "me",
    accountHolder: str(r.account_holder_name),
    accountNumber: str(r.account_number),
    ifsc: str(r.ifsc),
    bankName: str(r.bank_name),
    branch: str(r.branch),
    upiId: str(r.upi_id),
    staticQr,
    updatedAt: str(r.updated_at),
  };
}

export function presetFromRow(r: Row): Preset {
  return {
    id: str(r.id),
    label: str(r.label),
    description: str(r.description),
    unitLabel: str(r.unit_label),
    defaultRate: r.default_rate === null || r.default_rate === undefined ? null : paise(r.default_rate),
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    deletedAt: (r.deleted_at as string | null) ?? null,
  };
}

export function paymentToRow(p: PaymentDetails, userId: string): Row {
  return {
    user_id: userId,
    account_holder_name: blank(p.accountHolder),
    account_number: blank(p.accountNumber),
    ifsc: blank(p.ifsc),
    bank_name: blank(p.bankName),
    branch: blank(p.branch),
    upi_id: blank(p.upiId),
    updated_at: p.updatedAt,
  };
}

export function partyToRow(p: Party, userId: string): Row {
  return {
    id: p.id,
    user_id: userId,
    type: p.type,
    name: p.name,
    gstin: blank(p.gstin),
    ...addressToRow(p.address),
    contact_person: blank(p.contactPerson),
    email: blank(p.email),
    phone: blank(p.phone),
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    deleted_at: p.deletedAt,
  };
}

export function partyFromRow(r: Row): Party {
  return {
    id: str(r.id),
    type: r.type === "agency" ? "agency" : "brand",
    name: str(r.name),
    gstin: str(r.gstin),
    address: addressFromRow(r),
    contactPerson: str(r.contact_person),
    email: str(r.email),
    phone: str(r.phone),
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    deletedAt: (r.deleted_at as string | null) ?? null,
  };
}

export function presetToRow(p: Preset, userId: string): Row {
  return {
    id: p.id,
    user_id: userId,
    label: p.label,
    description: blank(p.description),
    unit_label: blank(p.unitLabel),
    default_rate: rupees(p.defaultRate),
    sort_order: p.sortOrder,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    deleted_at: p.deletedAt,
  };
}

/** One Dexie invoice → an `invoices` row plus its `invoice_items` rows. */
export function invoiceToRows(inv: Invoice, userId: string): { invoice: Row; items: Row[] } {
  const t = computeTotals(inv.items, inv);
  return {
    invoice: {
      id: inv.id,
      user_id: userId,
      invoice_number: inv.number,
      financial_year: inv.financialYear,
      status: inv.status,
      invoice_date: inv.invoiceDate,
      payment_terms: inv.paymentTerms,
      due_date: blank(inv.dueDate),
      delivery_date: blank(inv.deliveryDate),
      bill_to_party_id: inv.billToId,
      via_agency: inv.viaAgency,
      end_brand_name: blank(inv.endBrandName),
      campaign_name: blank(inv.campaignName),
      from_snapshot: inv.fromSnapshot,
      bill_to_snapshot: inv.billToSnapshot,
      payment_snapshot: inv.paymentSnapshot,
      is_tax_invoice: inv.gstMode !== "none",
      gst_mode: inv.gstMode,
      gst_rate: inv.gstRate,
      sac_code: blank(inv.sacCode),
      subtotal: rupees(t.subtotal),
      cgst_amount: rupees(t.cgst),
      sgst_amount: rupees(t.sgst),
      igst_amount: rupees(t.igst),
      total: rupees(t.total),
      amount_in_words: t.total > 0 ? amountInWords(t.total) : null,
      show_tds: inv.showTds,
      tds_rate: inv.tdsRate,
      tds_amount: inv.showTds ? rupees(t.tds) : null,
      net_receivable: rupees(t.netReceivable),
      notes: blank(inv.notes),
      include_bank: inv.includeBank,
      include_upi_qr: inv.includeUpiQr,
      include_signature: inv.includeSignature,
      template: inv.template,
      sent_at: inv.sentAt,
      paid_date: inv.paidDate,
      created_at: inv.createdAt,
      updated_at: inv.updatedAt,
      deleted_at: inv.deletedAt,
    },
    items: inv.items.map((i, position) => ({
      id: i.id,
      invoice_id: inv.id,
      user_id: userId,
      position,
      description: i.description,
      unit_label: blank(i.unitLabel),
      quantity: i.quantity,
      rate: rupees(i.rate),
      updated_at: inv.updatedAt,
    })),
  };
}

/** `invoices` row + its `invoice_items` rows → one Dexie invoice. Totals are recomputed locally. */
export function invoiceFromRows(r: Row, itemRows: Row[]): Invoice {
  const items: LineItem[] = [...itemRows]
    .filter((i) => !i.deleted_at)
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((i) => ({ id: str(i.id), description: str(i.description), unitLabel: str(i.unit_label), quantity: Number(i.quantity), rate: paise(i.rate) }));
  return {
    id: str(r.id),
    number: str(r.invoice_number),
    financialYear: str(r.financial_year),
    status: r.status === "paid" || r.status === "pending" ? r.status : "draft",
    invoiceDate: str(r.invoice_date),
    paymentTerms: (r.payment_terms as Invoice["paymentTerms"]) ?? "due_on_receipt",
    dueDate: str(r.due_date),
    deliveryDate: str(r.delivery_date),
    billToId: (r.bill_to_party_id as string | null) ?? null,
    viaAgency: !!r.via_agency,
    endBrandName: str(r.end_brand_name),
    campaignName: str(r.campaign_name),
    items,
    gstMode: (r.gst_mode as Invoice["gstMode"]) ?? "none",
    gstRate: Number(r.gst_rate ?? 0),
    sacCode: str(r.sac_code),
    showTds: !!r.show_tds,
    tdsRate: r.tds_rate === null || r.tds_rate === undefined ? null : Number(r.tds_rate),
    notes: str(r.notes),
    includeBank: !!r.include_bank,
    includeUpiQr: !!r.include_upi_qr,
    includeSignature: !!r.include_signature,
    template: isTemplateId(r.template) ? r.template : null,
    fromSnapshot: (r.from_snapshot as Invoice["fromSnapshot"]) ?? null,
    billToSnapshot: (r.bill_to_snapshot as Invoice["billToSnapshot"]) ?? null,
    paymentSnapshot: (r.payment_snapshot as Invoice["paymentSnapshot"]) ?? null,
    sentAt: (r.sent_at as string | null) ?? null,
    paidDate: (r.paid_date as string | null) ?? null,
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
    deletedAt: (r.deleted_at as string | null) ?? null,
  };
}

/** Last-write-wins merge: keep whichever copy was updated most recently. */
export function newer<T extends { updatedAt: string }>(local: T | undefined, remote: T): T {
  if (!local) return remote;
  return remote.updatedAt > local.updatedAt ? remote : local;
}
