"use client";

/**
 * Sign-in with an email and a one-time code. No passwords.
 *
 *  - Signed out: signInWithOtp emails a code, verifyOtp checks it.
 *  - Anonymous tester ("Skip for now"): updateUser attaches the email to the
 *    same user, so data already saved is kept. If that email already has an
 *    account, we sign in to it instead.
 */
import { useSyncExternalStore } from "react";
import { db } from "@/db";
import { isSyncConfigured } from "./sync";
import { supabase } from "./supabase";
import { syncNow } from "./sync-engine";

export interface AuthState {
  status: "loading" | "signedOut" | "anonymous" | "signedIn";
  email: string;
}

const LOADING: AuthState = { status: "loading", email: "" };
let state: AuthState = LOADING;
let started = false;
const listeners = new Set<() => void>();

function publish(next: AuthState) {
  if (next.status === state.status && next.email === state.email) return;
  state = next;
  listeners.forEach((l) => l());
}

function fromSession(s: { user: { is_anonymous?: boolean; email?: string } } | null): AuthState {
  if (!s) return { status: "signedOut", email: "" };
  return s.user.is_anonymous || !s.user.email ? { status: "anonymous", email: "" } : { status: "signedIn", email: s.user.email };
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (!isSyncConfigured()) {
    publish({ status: "signedOut", email: "" });
    return;
  }
  const sb = supabase();
  void sb.auth.getSession().then(({ data }) => publish(fromSession(data.session)));
  sb.auth.onAuthStateChange((_e, session) => publish(fromSession(session)));
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (cb) => {
      start();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => LOADING,
  );
}

// ---- "Skip for now" choice (this browser only)

const SKIP_KEY = "billy-sign-in-skipped";

export function hasSkippedSignIn(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) === "1";
  } catch {
    return false;
  }
}

export function skipSignIn(): void {
  try {
    localStorage.setItem(SKIP_KEY, "1");
  } catch {
    /* private mode: the skip lasts until reload */
  }
  void syncNow();
}

// ---- Sign in

/**
 * TESTING MODE (default): sign in with just an email, no code. Under the hood the
 * email maps to a fixed password, so anyone who knows an address can open that
 * account. Fine for 2-3 testers, NOT for real users. Set
 * NEXT_PUBLIC_AUTH_MODE=otp to switch back to the emailed code.
 * Needs "Confirm email" turned off in Supabase (Authentication > Sign In / Providers > Email).
 */
export const EMAIL_ONLY = process.env.NEXT_PUBLIC_AUTH_MODE !== "otp";

export async function signInWithEmail(email: string): Promise<void> {
  const sb = supabase();
  const password = `billy-testing::${email}`;
  const first = await sb.auth.signInWithPassword({ email, password });
  if (first.error) {
    if (!/invalid login|credentials/i.test(first.error.message)) throw new Error(friendly(first.error.message));
    const up = await sb.auth.signUp({ email, password });
    if (up.error) {
      throw new Error(/already/i.test(up.error.message) ? "This email was set up another way. Use a different email" : friendly(up.error.message));
    }
    if (!up.data.session) throw new Error("Turn off Confirm email in Supabase (Authentication > Sign In / Providers > Email)");
  }
  void syncNow();
}

export type CodeMode = "login" | "change";

export async function sendCode(email: string): Promise<CodeMode> {
  const sb = supabase();
  const { data } = await sb.auth.getSession();
  if (data.session?.user.is_anonymous) {
    const { error } = await sb.auth.updateUser({ email });
    if (!error) return "change";
    if (!/already|registered|exists/i.test(error.message)) throw new Error(friendly(error.message));
  }
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw new Error(friendly(error.message));
  return "login";
}

export async function verifyCode(email: string, code: string, mode: CodeMode): Promise<void> {
  const { error } = await supabase().auth.verifyOtp({ email, token: code.trim(), type: mode === "change" ? "email_change" : "email" });
  if (error) throw new Error(friendly(error.message));
  void syncNow();
}

function friendly(m: string): string {
  const s = m.toLowerCase();
  if (s.includes("rate") || s.includes("seconds") || s.includes("too many")) return "Too many tries. Wait a minute and try again";
  if (s.includes("expired") || s.includes("invalid")) return "That code is wrong or has expired. Check it or ask for a new one";
  if (s.includes("valid email") || s.includes("email address")) return "Email should look like name@example.com";
  return m;
}

/**
 * Sign out. Changes are pushed first, then this device's copy is cleared so the
 * next person who signs in here never inherits it. The data stays in the account.
 */
export async function signOut(): Promise<void> {
  const info = await syncNow();
  if (info.status !== "synced") {
    throw new Error("Connect to the internet and wait for sync to finish, so nothing is lost");
  }
  await supabase().auth.signOut();
  await Promise.all([db.profile.clear(), db.payment.clear(), db.parties.clear(), db.presets.clear(), db.invoices.clear(), db.kv.clear()]);
  try {
    localStorage.removeItem(SKIP_KEY);
  } catch {
    /* ignore */
  }
  window.location.reload();
}
