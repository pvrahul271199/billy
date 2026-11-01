"use client";

import { useRef, useState } from "react";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { Button, Card, ConfirmDialog, FieldError, useToast } from "@/components/ui";
import { PushedScreen } from "@/components/screens/Screen";
import { backupFileName, backupSummary, parseBackup, type BackupFile } from "@/lib/backup";
import { exportBackup, importBackup } from "@/db/backup";
import { todayISO } from "@/lib/dates";
import { downloadBlob } from "@/lib/download";

export function BackupScreen() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doExport() {
    setExporting(true);
    try {
      const data = await exportBackup();
      downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), backupFileName(todayISO()));
      toast.show("Backup downloaded");
    } finally {
      setExporting(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const result = parseBackup(await file.text());
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPending(result.data);
  }

  const summary = pending ? backupSummary(pending) : null;

  return (
    <PushedScreen title="Backup">
      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="text-[15px] font-medium">Your data stays on this device</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-soft">
            Billy doesn&apos;t upload anything. Export a backup now and then, and keep it somewhere safe like Google Drive.
            If you clear your browser data or change phones, import it to get everything back.
          </p>
        </Card>

        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-medium">Export</h2>
          <p className="text-sm text-soft">Profile, bank details, brands, saved items, invoices and images, in one JSON file.</p>
          <Button variant="tint" icon={DownloadSimple} fullWidth loading={exporting} onClick={() => void doExport()}>
            Export backup
          </Button>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] font-medium">Import</h2>
          <p className="text-sm text-soft">Replaces everything on this device with the backup&apos;s contents.</p>
          <Button variant="tint" icon={UploadSimple} fullWidth onClick={() => fileRef.current?.click()}>
            Choose backup file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {error ? (
            <div role="alert">
              <FieldError>{error}</FieldError>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Replace all data on this device?"
        description={
          summary
            ? `The backup${summary.name ? ` for ${summary.name}` : ""} has ${summary.invoices} invoices, ${summary.parties} brands and ${summary.presets} saved items. Everything currently in Billy on this device will be replaced. This can't be undone.`
            : undefined
        }
        confirmLabel="Replace data"
        loading={importing}
        onConfirm={async () => {
          if (!pending) return;
          setImporting(true);
          try {
            await importBackup(pending);
            setPending(null);
            toast.show("Backup imported");
          } catch {
            setError("The import didn't finish. Your existing data is unchanged. Try again.");
            setPending(null);
          } finally {
            setImporting(false);
          }
        }}
      />
    </PushedScreen>
  );
}
