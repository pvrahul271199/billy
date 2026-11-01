import { db, setKV } from "./index";
import { BACKUP_VERSION, type BackupFile } from "@/lib/backup";

export async function exportBackup(): Promise<BackupFile> {
  const [profile, payment, parties, presets, invoices] = await Promise.all([
    db.profile.get("me"),
    db.payment.get("me"),
    db.parties.toArray(),
    db.presets.toArray(),
    db.invoices.toArray(),
  ]);
  return {
    app: "billy",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: profile ?? null,
    payment: payment ?? null,
    parties,
    presets,
    invoices,
  };
}

/** Replace everything on this device with the backup's contents. */
export async function importBackup(b: BackupFile): Promise<void> {
  await db.transaction("rw", [db.profile, db.payment, db.parties, db.presets, db.invoices, db.kv], async () => {
    await Promise.all([db.profile.clear(), db.payment.clear(), db.parties.clear(), db.presets.clear(), db.invoices.clear()]);
    if (b.profile) await db.profile.put(b.profile);
    if (b.payment) await db.payment.put(b.payment);
    await db.parties.bulkPut(b.parties);
    await db.presets.bulkPut(b.presets);
    await db.invoices.bulkPut(b.invoices);
    await db.kv.delete("invoiceForm");
    await setKV("presetsSeeded", true);
  });
}
