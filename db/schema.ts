import Dexie, { type EntityTable } from "dexie";
import type { Address, Invoice, Party, PaymentDetails, Preset, Profile } from "@/types";
import { DEFAULT_PREFIX } from "@/lib/numbering";

/** Key/value store for app state such as the autosaved invoice form. */
export interface KV {
  key: string;
  value: unknown;
}

/**
 * Local-first database. Field names mirror supabase/schema.sql
 * (camelCase here ↔ snake_case there). Ids are client-generated UUIDs.
 */
class BillyDB extends Dexie {
  profile!: EntityTable<Profile, "id">;
  payment!: EntityTable<PaymentDetails, "id">;
  parties!: EntityTable<Party, "id">;
  presets!: EntityTable<Preset, "id">;
  invoices!: EntityTable<Invoice, "id">;
  kv!: EntityTable<KV, "key">;

  constructor() {
    super("billy");
    this.version(1).stores({
      profile: "id",
      payment: "id",
      parties: "id, name, type, updatedAt",
      presets: "id, sortOrder, updatedAt",
      invoices: "id, number, status, invoiceDate, financialYear, billToId, updatedAt",
      kv: "key",
    });
  }
}

export const db = new BillyDB();

export function uuid(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export const emptyAddress = (): Address => ({ line1: "", line2: "", city: "", stateCode: "", pin: "" });

export function defaultProfile(): Profile {
  return {
    id: "me",
    fullName: "",
    instagram: "",
    email: "",
    phone: "",
    pan: "",
    address: emptyAddress(),
    photo: null,
    logo: null,
    signature: null,
    gstRegistered: false,
    gstin: "",
    defaultSac: "",
    defaultTdsRate: null,
    invoicePrefix: DEFAULT_PREFIX,
    defaultNotes: "",
    onboardedAt: null,
    updatedAt: now(),
  };
}

export function defaultPayment(): PaymentDetails {
  return {
    id: "me",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branch: "",
    upiId: "",
    staticQr: null,
    updatedAt: now(),
  };
}

