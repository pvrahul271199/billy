"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaultPayment, defaultProfile, listInvoices, listParties, listPresets } from "@/db";
import { todayISO } from "@/lib/dates";

/** undefined while loading. */
export function useProfile() {
  return useLiveQuery(async () => (await db.profile.get("me")) ?? defaultProfile(), []);
}

export function usePayment() {
  return useLiveQuery(async () => (await db.payment.get("me")) ?? defaultPayment(), []);
}

export function useParties() {
  return useLiveQuery(listParties, []);
}

export function usePresets() {
  return useLiveQuery(listPresets, []);
}

export function useInvoices() {
  return useLiveQuery(listInvoices, []);
}

export function useInvoice(id: string | null) {
  return useLiveQuery(async () => (id ? ((await db.invoices.get(id)) ?? null) : null), [id]);
}

/** Today's date, refreshed when the app comes back to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const refresh = () => setToday(todayISO());
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);
  return today;
}
