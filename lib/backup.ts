import type { Invoice, Party, PaymentDetails, Preset, Profile } from "@/types";

export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: "billy";
  version: number;
  exportedAt: string;
  profile: Profile | null;
  payment: PaymentDetails | null;
  parties: Party[];
  presets: Preset[];
  invoices: Invoice[];
}

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function allHaveIds(list: unknown[]): boolean {
  return list.every((x) => isObj(x) && typeof x.id === "string" && x.id.length > 0);
}

/** Parse and sanity-check a backup file's text. Pure: no database access. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't valid JSON. Choose a Billy backup file." };
  }
  if (!isObj(raw) || raw.app !== "billy") {
    return { ok: false, error: "This isn't a Billy backup. Choose a file exported from Billy." };
  }
  if (typeof raw.version !== "number" || raw.version > BACKUP_VERSION) {
    return { ok: false, error: "This backup is from a newer version of Billy. Update the app and try again." };
  }
  const lists = ["parties", "presets", "invoices"] as const;
  for (const key of lists) {
    const list = raw[key];
    if (!Array.isArray(list) || !allHaveIds(list)) {
      return { ok: false, error: "This backup is damaged and can't be imported." };
    }
  }
  const invoices = raw.invoices as unknown[];
  if (!invoices.every((i) => isObj(i) && typeof i.number === "string" && Array.isArray(i.items))) {
    return { ok: false, error: "This backup is damaged and can't be imported." };
  }
  if (raw.profile !== null && !(isObj(raw.profile) && raw.profile.id === "me")) {
    return { ok: false, error: "This backup is damaged and can't be imported." };
  }
  return { ok: true, data: raw as unknown as BackupFile };
}

/** Counts for the import confirmation. Deleted records are not counted. */
export function backupSummary(b: BackupFile) {
  const live = <T extends { deletedAt: string | null }>(l: T[]) => l.filter((x) => !x.deletedAt).length;
  return { invoices: live(b.invoices), parties: live(b.parties), presets: live(b.presets), name: b.profile?.fullName ?? "" };
}

export function backupFileName(date: string): string {
  return `billy-backup-${date}.json`;
}
