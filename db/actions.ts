import type { BillToSnapshot, FromSnapshot, Invoice, Party, PaymentDetails, PaymentSnapshot, Preset, Profile } from "@/types";
import { DEFAULT_PREFIX, financialYear, nextInvoiceNumber, sanitizePrefix } from "@/lib/numbering";
import { remoteInvoiceNumbers } from "@/lib/remote-numbers";
import { dueDateFor, todayISO } from "@/lib/dates";
import { resolveTemplate } from "@/lib/invoice-templates";
import { DEFAULT_GST_RATE, gstModeFor } from "@/lib/tax";
import { db, defaultPayment, defaultProfile, emptyAddress, now, uuid } from "./schema";
import { snapshotBillTo, snapshotFrom, snapshotPayment } from "@/lib/snapshots";

export { snapshotBillTo, snapshotFrom, snapshotPayment };

/**
 * Reads and writes against the local database. Every call resolves in a few
 * milliseconds; screens subscribe through db/queries.ts and update instantly.
 */

export async function getProfile(): Promise<Profile> {
  return (await db.profile.get("me")) ?? defaultProfile();
}

export async function getPayment(): Promise<PaymentDetails> {
  return (await db.payment.get("me")) ?? defaultPayment();
}

export async function saveProfile(patch: Partial<Omit<Profile, "id">>): Promise<void> {
  const current = await getProfile();
  await db.profile.put({ ...current, ...patch, id: "me", updatedAt: now() });
  if (patch.signature && !current.signature) await enableSignatureOnDrafts();
}

/**
 * First signature added: turn it on for drafts started without one. The toggle
 * is disabled until a signature exists, so "off" on those drafts was never a choice.
 */
async function enableSignatureOnDrafts(): Promise<void> {
  const drafts = (await db.invoices.toArray()).filter((i) => i.status === "draft" && !i.deletedAt && !i.includeSignature);
  await Promise.all(drafts.map((i) => saveInvoice({ ...i, includeSignature: true })));
  const form = await db.kv.get("invoiceForm");
  const value = form?.value as { invoice?: Invoice } | undefined;
  if (value?.invoice && !value.invoice.includeSignature) {
    await db.kv.put({ key: "invoiceForm", value: { ...value, invoice: { ...value.invoice, includeSignature: true } } });
  }
}

export async function savePayment(patch: Partial<Omit<PaymentDetails, "id">>): Promise<void> {
  const current = await getPayment();
  await db.payment.put({ ...current, ...patch, id: "me", updatedAt: now() });
}

// ---------------------------------------------------------------- presets

/** Built-in quick-add items, seeded once so the creator can edit rates in Profile. */
export const BUILT_IN_PRESETS: Array<Pick<Preset, "label" | "description" | "unitLabel">> = [
  { label: "Instagram Reel", description: "Instagram Reel", unitLabel: "Reel" },
  { label: "Story set", description: "Instagram Story set", unitLabel: "Story set" },
  { label: "Static post", description: "Instagram static post", unitLabel: "Static post" },
  { label: "Carousel", description: "Instagram carousel post", unitLabel: "Carousel" },
  { label: "Link in bio", description: "Link in bio", unitLabel: "Link in bio" },
  { label: "Usage rights", description: "Content usage rights", unitLabel: "" },
  { label: "Whitelisting / paid ads access", description: "Whitelisting / paid ads access", unitLabel: "" },
];

export async function seedPresetsIfEmpty(): Promise<void> {
  const seeded = await db.kv.get("presetsSeeded");
  if (seeded) return;
  const ts = now();
  await db.transaction("rw", db.presets, db.kv, async () => {
    if ((await db.presets.count()) === 0) {
      await db.presets.bulkAdd(
        BUILT_IN_PRESETS.map((p, i) => ({
          ...p,
          id: uuid(),
          defaultRate: null,
          sortOrder: i,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        })),
      );
    }
    await db.kv.put({ key: "presetsSeeded", value: true });
  });
}

export async function listPresets(): Promise<Preset[]> {
  const all = await db.presets.orderBy("sortOrder").toArray();
  return all.filter((p) => !p.deletedAt);
}

// ---------------------------------------------------------------- parties

export async function listParties(): Promise<Party[]> {
  const all = await db.parties.toArray();
  return all.filter((p) => !p.deletedAt).sort((a, b) => a.name.localeCompare(b.name));
}

export function newParty(type: Party["type"] = "brand"): Party {
  const ts = now();
  return {
    id: uuid(),
    type,
    name: "",
    gstin: "",
    address: emptyAddress(),
    contactPerson: "",
    email: "",
    phone: "",
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function saveParty(party: Party): Promise<void> {
  await db.parties.put({ ...party, updatedAt: now() });
}

export async function deleteParty(id: string): Promise<void> {
  await db.parties.update(id, { deletedAt: now(), updatedAt: now() });
}

// ---------------------------------------------------------------- invoices

export async function listInvoices(): Promise<Invoice[]> {
  const all = await db.invoices.toArray();
  return all
    .filter((i) => !i.deletedAt)
    .sort((a, b) => (a.invoiceDate === b.invoiceDate ? b.createdAt.localeCompare(a.createdAt) : b.invoiceDate.localeCompare(a.invoiceDate)));
}

export async function allInvoiceNumbers(excludeId?: string): Promise<string[]> {
  const all = await db.invoices.toArray();
  return all.filter((i) => !i.deletedAt && i.id !== excludeId).map((i) => i.number);
}

/**
 * Numbers the sequence must never reuse: every live invoice, plus deleted ones
 * that were already sent (a number given to a brand stays taken). Deleted drafts free theirs.
 */
export async function usedNumbersForSequence(excludeId?: string): Promise<string[]> {
  const all = await db.invoices.toArray();
  return all.filter((i) => i.id !== excludeId && (!i.deletedAt || i.sentAt)).map((i) => i.number);
}

/** Local numbers plus, when online, numbers from other devices on the same account. */
export async function sequenceNumbers(prefix: string, date: string, excludeId?: string): Promise<string[]> {
  const head = `${sanitizePrefix(prefix) || DEFAULT_PREFIX}/${financialYear(date)}/`;
  const [local, remote] = await Promise.all([usedNumbersForSequence(excludeId), remoteInvoiceNumbers(head, excludeId)]);
  return [...local, ...remote];
}

/** A fresh invoice pre-filled from the creator's defaults. Not saved. */
export async function newInvoice(): Promise<Invoice> {
  const [profile, payment] = await Promise.all([getProfile(), getPayment()]);
  const today = todayISO();
  const ts = now();
  return {
    id: uuid(),
    number: nextInvoiceNumber(profile.invoicePrefix, today, await sequenceNumbers(profile.invoicePrefix, today)),
    financialYear: financialYear(today),
    status: "draft",
    invoiceDate: today,
    paymentTerms: "net_15",
    dueDate: dueDateFor("net_15", today, today),
    deliveryDate: "",
    billToId: null,
    viaAgency: false,
    endBrandName: "",
    campaignName: "",
    items: [],
    gstMode: gstModeFor(profile.gstRegistered, profile.address.stateCode, ""),
    gstRate: profile.gstRegistered ? DEFAULT_GST_RATE : 0,
    sacCode: profile.defaultSac,
    showTds: profile.defaultTdsRate !== null,
    tdsRate: profile.defaultTdsRate,
    notes: profile.defaultNotes,
    includeBank: !!(payment.accountNumber && payment.ifsc),
    includeUpiQr: !!(payment.upiId || payment.staticQr),
    includeSignature: true,
    template: null,
    fromSnapshot: null,
    billToSnapshot: null,
    paymentSnapshot: null,
    sentAt: null,
    paidDate: null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
}

export async function saveInvoice(inv: Invoice): Promise<void> {
  await db.invoices.put({ ...inv, financialYear: financialYear(inv.invoiceDate), updatedAt: now() });
}

/** Freeze creator, bill-to and payment details onto the invoice. */
async function withSnapshots(inv: Invoice): Promise<Invoice> {
  const [profile, payment, party] = await Promise.all([
    getProfile(),
    getPayment(),
    inv.billToId ? db.parties.get(inv.billToId) : Promise.resolve(undefined),
  ]);
  return {
    ...inv,
    template: resolveTemplate(inv.template, profile.invoiceTemplate),
    fromSnapshot: snapshotFrom(profile),
    billToSnapshot: party ? snapshotBillTo(party) : inv.billToSnapshot,
    paymentSnapshot: snapshotPayment(payment),
  };
}

/** Mark as sent: status becomes pending and details are frozen. */
export async function markAsSent(id: string): Promise<void> {
  const inv = await db.invoices.get(id);
  if (!inv) return;
  await saveInvoice({ ...(await withSnapshots(inv)), status: "pending", sentAt: now() });
}

/** Re-freeze details after editing an invoice that was already sent. */
export async function refreezeSnapshots(id: string): Promise<void> {
  const inv = await db.invoices.get(id);
  if (!inv || inv.status === "draft") return;
  await saveInvoice(await withSnapshots(inv));
}

export async function markAsPaid(id: string, paidDate: string): Promise<void> {
  const inv = await db.invoices.get(id);
  if (!inv) return;
  const frozen = inv.fromSnapshot ? inv : await withSnapshots(inv);
  await saveInvoice({ ...frozen, status: "paid", paidDate, sentAt: inv.sentAt ?? now() });
}

/** Undo "paid": back to pending. */
export async function markAsUnpaid(id: string): Promise<void> {
  const inv = await db.invoices.get(id);
  if (!inv) return;
  await saveInvoice({ ...inv, status: "pending", paidDate: null });
}

/** Copy an invoice as a new draft with a new number and today's date. */
export async function duplicateInvoice(id: string): Promise<string | null> {
  const src = await db.invoices.get(id);
  if (!src) return null;
  const profile = await getProfile();
  const today = todayISO();
  const ts = now();
  const copy: Invoice = {
    ...src,
    id: uuid(),
    number: nextInvoiceNumber(profile.invoicePrefix, today, await sequenceNumbers(profile.invoicePrefix, today)),
    financialYear: financialYear(today),
    status: "draft",
    invoiceDate: today,
    dueDate: dueDateFor(src.paymentTerms === "custom" ? "net_15" : src.paymentTerms, today, today),
    paymentTerms: src.paymentTerms === "custom" ? "net_15" : src.paymentTerms,
    deliveryDate: "",
    items: src.items.map((i) => ({ ...i, id: uuid() })),
    fromSnapshot: null,
    billToSnapshot: null,
    paymentSnapshot: null,
    sentAt: null,
    paidDate: null,
    createdAt: ts,
    updatedAt: ts,
    deletedAt: null,
  };
  await db.invoices.add(copy);
  return copy.id;
}

/** Soft delete, so a future cloud sync can propagate it. */
export async function deleteInvoice(id: string): Promise<void> {
  await db.invoices.update(id, { deletedAt: now(), updatedAt: now() });
}

// ---------------------------------------------------------------- kv

export async function getKV<T>(key: string): Promise<T | undefined> {
  return (await db.kv.get(key))?.value as T | undefined;
}

export async function setKV(key: string, value: unknown): Promise<void> {
  await db.kv.put({ key, value });
}

export async function deleteKV(key: string): Promise<void> {
  await db.kv.delete(key);
}
