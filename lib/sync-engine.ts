"use client";

/**
 * Background cloud sync. The device (Dexie) stays the source of truth and the
 * UI never waits on the network:
 *
 *  - No login. Each browser signs in anonymously, which gives it its own
 *    auth.uid(). Every row carries that user_id, so RLS isolates testers and
 *    every index in supabase/schema.sql leads with user_id.
 *  - Every local write (save, mark sent/paid, delete…) schedules a push a
 *    moment later, so the cloud follows each save.
 *  - Push first, then pull. Last write wins on updated_at.
 *  - Failures never block the app. Failed rows are remembered and retried.
 */
import { useSyncExternalStore } from "react";
import { db, getKV, setKV } from "@/db";
import type { Invoice, Party, PaymentDetails, Preset, Profile } from "@/types";
import {
  invoiceFromRows,
  invoiceToRows,
  isSyncConfigured,
  newer,
  partyFromRow,
  partyToRow,
  paymentFromRow,
  paymentToRow,
  presetFromRow,
  presetToRow,
  profileFromRow,
  profileToRow,
} from "./sync";
import { supabase } from "./supabase";
import { nextInvoiceNumber } from "./numbering";
import { remoteInvoiceNumbers } from "./remote-numbers";
import { hasSkippedSignIn } from "./auth";

type Row = Record<string, unknown>;
type TableKey = "profile" | "payment" | "parties" | "presets" | "invoices";

interface SyncState {
  pushedAt: Partial<Record<TableKey, string>>;
  pulledAt: Partial<Record<TableKey, string>>;
  failed: Partial<Record<TableKey, string[]>>;
  /** Hash of the image last uploaded per field, so unchanged images aren't re-sent. */
  uploaded: Record<string, string>;
  /** Cloud user these watermarks belong to. */
  uid?: string;
}

const STATE_KEY = "syncState";
const BUCKET = "creator-assets";
const PUSH_DELAY_MS = 400;
const RETRY_MS = 30_000;
/** Pull a little before the watermark so a slow device clock can't hide a row. */
const PULL_OVERLAP_MS = 5 * 60_000;

export type SyncStatus = "off" | "syncing" | "synced" | "offline" | "error";
export interface SyncInfo {
  status: SyncStatus;
  message: string;
  lastSyncedAt: string | null;
}

let info: SyncInfo = { status: "off", message: "Cloud sync is not set up", lastSyncedAt: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<SyncInfo>) => {
  info = { ...info, ...patch };
  listeners.forEach((l) => l());
};

export function useSyncInfo(): SyncInfo {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => info,
    () => info,
  );
}

class NeedsSignIn extends Error {}

async function userId(): Promise<string> {
  const sb = supabase();
  const { data } = await sb.auth.getSession();
  if (data.session) return data.session.user.id;
  if (!hasSkippedSignIn()) throw new NeedsSignIn();
  const { data: anon, error } = await sb.auth.signInAnonymously();
  if (error || !anon.user) {
    throw new Error(
      error?.message?.toLowerCase().includes("anonymous")
        ? "Turn on anonymous sign-ins in Supabase (Authentication > Sign In / Providers)"
        : (error?.message ?? "Could not sign in"),
    );
  }
  return anon.user.id;
}

async function loadState(): Promise<SyncState> {
  return (await getKV<SyncState>(STATE_KEY)) ?? { pushedAt: {}, pulledAt: {}, failed: {}, uploaded: {} };
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h}`;
}

// ------------------------------------------------------------------ images

async function dataUrlToBlob(url: string): Promise<Blob> {
  return await (await fetch(url)).blob();
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Upload a data URL; returns the storage path, or null when empty or not uploadable. */
async function uploadImage(uid: string, field: string, dataUrl: string | null, state: SyncState): Promise<string | null | undefined> {
  if (!dataUrl) {
    delete state.uploaded[field];
    return null;
  }
  const h = hash(dataUrl);
  const blob = await dataUrlToBlob(dataUrl);
  const ext = EXT[blob.type];
  if (!ext || blob.size > 2_097_152) return undefined; // unsupported type or over the bucket limit: keep local only
  const path = `${uid}/${field}.${ext}`;
  if (state.uploaded[field] === `${h}|${path}`) return path;
  const { error } = await supabase().storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
  if (error) throw error;
  state.uploaded[field] = `${h}|${path}`;
  return path;
}

async function downloadImage(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase().storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return await blobToDataUrl(data);
}

// -------------------------------------------------------------------- push

async function upsert(table: string, rows: Row[], onConflict?: string) {
  if (!rows.length) return;
  const { error } = await supabase().from(table).upsert(rows, { onConflict });
  if (error) throw error;
}

/** Rows changed since the watermark, plus rows that failed last time. */
function dirty<T extends { id: string; updatedAt: string }>(all: T[], mark: string | undefined, failed: string[] | undefined): T[] {
  return all.filter((r) => !mark || r.updatedAt > mark || failed?.includes(r.id));
}

async function pushTable<T extends { id: string; updatedAt: string }>(
  key: TableKey,
  state: SyncState,
  all: T[],
  send: (rows: T[]) => Promise<void>,
): Promise<void> {
  const rows = dirty(all, state.pushedAt[key], state.failed[key]);
  if (!rows.length) return;
  const failed: string[] = [];
  try {
    await send(rows);
  } catch {
    // Retry one by one so a single bad row doesn't hold back the rest.
    for (const r of rows) {
      try {
        await send([r]);
      } catch (e) {
        failed.push(r.id);
        console.warn(`[sync] ${key} ${r.id} not saved to cloud:`, (e as Error).message);
      }
    }
  }
  state.failed[key] = failed;
  state.pushedAt[key] = rows.reduce((m, r) => (r.updatedAt > m ? r.updatedAt : m), state.pushedAt[key] ?? "");
}

async function push(uid: string, state: SyncState): Promise<void> {
  const profile = await db.profile.get("me");
  const payment = await db.payment.get("me");

  if (profile) {
    await pushTable<Profile & { id: string }>("profile", state, [profile], async ([p]) => {
      const row = profileToRow(p!, uid);
      const [photo, logo, signature] = await Promise.all([
        uploadImage(uid, "photo", p!.photo, state),
        uploadImage(uid, "logo", p!.logo, state),
        uploadImage(uid, "signature", p!.signature, state),
      ]);
      if (photo !== undefined) row.photo_path = photo;
      if (logo !== undefined) row.logo_path = logo;
      if (signature !== undefined) row.signature_path = signature;
      await upsert("profiles", [row], "id");
    });
  }
  if (payment) {
    await pushTable<PaymentDetails & { id: string }>("payment", state, [payment], async ([p]) => {
      const row = paymentToRow(p!, uid);
      const qr = await uploadImage(uid, "static-qr", p!.staticQr, state);
      if (qr !== undefined) row.static_qr_path = qr;
      await upsert("payment_details", [row], "user_id");
    });
  }
  await pushTable<Party>("parties", state, await db.parties.toArray(), (rows) =>
    upsert("parties", rows.map((r) => partyToRow(r, uid))),
  );
  await pushTable<Preset>("presets", state, await db.presets.toArray(), (rows) =>
    upsert("line_item_presets", rows.map((r) => presetToRow(r, uid))),
  );
  await pushTable<Invoice>("invoices", state, await db.invoices.toArray(), async (rows) => {
    let mapped = rows.map((r) => invoiceToRows(r, uid));
    const { error: bulkError } = await supabase().from("invoices").upsert(mapped.map((m) => m.invoice));
    if (bulkError) {
      // Same number used on another phone. An unsent draft can safely take the next free number.
      const only = rows[0];
      if (rows.length === 1 && only && bulkError.code === "23505" && !only.sentAt) {
        const head = `${only.number.split("/").slice(0, 2).join("/")}/`;
        const used = [...(await db.invoices.toArray()).filter((i) => i.id !== only.id).map((i) => i.number), ...(await remoteInvoiceNumbers(head, only.id))];
        const renumbered = { ...only, number: nextInvoiceNumber(only.number.split("/")[0]!, only.invoiceDate, used), updatedAt: new Date().toISOString() };
        await db.invoices.put(renumbered);
        mapped = [invoiceToRows(renumbered, uid)];
        await upsert("invoices", mapped.map((m) => m.invoice));
      } else {
        throw bulkError;
      }
    }
    await upsert("invoice_items", mapped.flatMap((m) => m.items));
    // Items removed locally must go from the cloud too.
    for (const m of mapped) {
      const keep = m.items.map((i) => String(i.id));
      let q = supabase().from("invoice_items").delete().eq("invoice_id", String(m.invoice.id));
      if (keep.length) q = q.not("id", "in", `(${keep.join(",")})`);
      const { error } = await q;
      if (error) throw error;
    }
  });
}

// -------------------------------------------------------------------- pull

function since(state: SyncState, key: TableKey): string | null {
  const m = state.pulledAt[key];
  return m ? new Date(new Date(m).getTime() - PULL_OVERLAP_MS).toISOString() : null;
}

async function fetchSince(table: string, select: string, mark: string | null): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 500) {
    let q = supabase().from(table).select(select).order("updated_at", { ascending: true }).range(from, from + 499);
    if (mark) q = q.gt("updated_at", mark);
    const { data, error } = await q;
    if (error) throw error;
    out.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < 500) return out;
  }
}

const maxUpdated = (rows: Row[], prev: string | undefined) => rows.reduce((m, r) => (String(r.updated_at) > m ? String(r.updated_at) : m), prev ?? "");

async function pull(state: SyncState): Promise<void> {
  // Profile and payment: one row each.
  const [pr] = await fetchSince("profiles", "*", since(state, "profile"));
  if (pr) {
    const local = await db.profile.get("me");
    // A brand-new cloud profile is empty; never let it replace a device that has data.
    const usable = !local || (pr.onboarded_at && String(pr.updated_at) > local.updatedAt);
    if (usable) {
      const [photo, logo, signature] = await Promise.all([
        downloadImage(pr.photo_path as string | null),
        downloadImage(pr.logo_path as string | null),
        downloadImage(pr.signature_path as string | null),
      ]);
      await db.profile.put(profileFromRow(pr, { photo, logo, signature }));
    }
    state.pulledAt.profile = maxUpdated([pr], state.pulledAt.profile);
  }
  const [py] = await fetchSince("payment_details", "*", since(state, "payment"));
  if (py) {
    const local = await db.payment.get("me");
    if (!local || String(py.updated_at) > local.updatedAt) {
      await db.payment.put(paymentFromRow(py, await downloadImage(py.static_qr_path as string | null)));
    }
    state.pulledAt.payment = maxUpdated([py], state.pulledAt.payment);
  }

  const parties = await fetchSince("parties", "*", since(state, "parties"));
  for (const r of parties) {
    const remote = partyFromRow(r);
    const local = await db.parties.get(remote.id);
    if (newer(local, remote) === remote && remote !== local) await db.parties.put(remote);
  }
  state.pulledAt.parties = maxUpdated(parties, state.pulledAt.parties);

  const presets = await fetchSince("line_item_presets", "*", since(state, "presets"));
  for (const r of presets) {
    const remote = presetFromRow(r);
    const local = await db.presets.get(remote.id);
    if (newer(local, remote) === remote && remote !== local) await db.presets.put(remote);
  }
  state.pulledAt.presets = maxUpdated(presets, state.pulledAt.presets);

  const invoices = await fetchSince("invoices", "*, invoice_items(*)", since(state, "invoices"));
  for (const r of invoices) {
    const remote = invoiceFromRows(r, (r.invoice_items as Row[] | undefined) ?? []);
    const local = await db.invoices.get(remote.id);
    if (newer(local, remote) === remote && remote !== local) await db.invoices.put(remote);
  }
  state.pulledAt.invoices = maxUpdated(invoices, state.pulledAt.invoices);
}

// ------------------------------------------------------------------ engine

let running = false;
let again = false;
let applying = false;

/** Run a sync now and wait for it. Used after sign-in and before sign-out. */
export async function syncNow(): Promise<SyncInfo> {
  if (!isSyncConfigured()) return info;
  while (running) await new Promise((r) => setTimeout(r, 100));
  await cycle();
  return info;
}

async function cycle(): Promise<void> {
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    do {
      again = false;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        set({ status: "offline", message: "Offline. Changes will sync when you're back online" });
        return;
      }
      set({ status: "syncing", message: "Syncing…" });
      const uid = await userId();
      let state = await loadState();
      if (state.uid !== uid) {
        // A different account on this device: everything here must be pushed to it afresh.
        state = { pushedAt: {}, pulledAt: {}, failed: {}, uploaded: {}, uid };
      }
      state.uid = uid;
      applying = true; // remote writes must not schedule another push
      try {
        await push(uid, state);
        await pull(state);
      } finally {
        applying = false;
        await setKV(STATE_KEY, state);
      }
      const failed = Object.values(state.failed).reduce((n, f) => n + (f?.length ?? 0), 0);
      set(
        failed
          ? { status: "error", message: `${failed} item${failed === 1 ? "" : "s"} could not be saved to the cloud. Will retry` }
          : { status: "synced", message: "All changes saved to the cloud", lastSyncedAt: new Date().toISOString() },
      );
    } while (again);
  } catch (e) {
    if (e instanceof NeedsSignIn) {
      set({ status: "off", message: "Sign in to back up your data" });
      return;
    }
    const msg = e instanceof Error ? e.message : "Sync failed";
    console.warn("[sync]", msg);
    set({ status: navigator.onLine ? "error" : "offline", message: msg });
  } finally {
    running = false;
  }
}

/** Starts background sync. A no-op until Supabase is configured. Returns a stop function. */
export function startBackgroundSync(): () => void {
  if (!isSyncConfigured()) return () => {};

  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (delay = PUSH_DELAY_MS) => {
    clearTimeout(timer);
    timer = setTimeout(() => void cycle(), delay);
  };
  const onWrite = () => {
    if (!applying) schedule();
  };

  const tables = [db.profile, db.payment, db.parties, db.presets, db.invoices];
  // Fires after the write succeeds, so every save/mark sent/paid/delete reaches the cloud.
  const hook = function (this: { onsuccess?: () => void }) {
    this.onsuccess = onWrite;
  };
  tables.forEach((t) => {
    t.hook("creating", hook as never);
    t.hook("updating", hook as never);
  });

  const online = () => schedule(0);
  window.addEventListener("online", online);
  const visible = () => document.visibilityState === "visible" && schedule(0);
  document.addEventListener("visibilitychange", visible);
  const retry = setInterval(() => {
    if (info.status === "error" || info.status === "offline") schedule(0);
  }, RETRY_MS);

  const { data: authSub } = supabase().auth.onAuthStateChange(() => schedule(0));

  schedule(0);
  return () => {
    authSub.subscription.unsubscribe();
    clearTimeout(timer);
    clearInterval(retry);
    window.removeEventListener("online", online);
    document.removeEventListener("visibilitychange", visible);
    tables.forEach((t) => {
      t.hook("creating").unsubscribe(hook as never);
      t.hook("updating").unsubscribe(hook as never);
    });
  };
}
