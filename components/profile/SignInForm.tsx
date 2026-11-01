"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { EMAIL_ONLY, sendCode, signInWithEmail, verifyCode, type CodeMode } from "@/lib/auth";
import { success } from "@/lib/haptics";
import { validateEmail } from "@/lib/validators";

/** Email only while testing (see lib/auth.ts), or email → 6-digit code. Calls onDone on success. */
export function SignInForm({ onDone, secondary }: { onDone?: () => void; secondary?: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<CodeMode | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const addr = email.trim().toLowerCase();
    const bad = !addr ? "Enter your email" : validateEmail(addr);
    if (bad) return setError(bad);
    setBusy(true);
    setError(undefined);
    try {
      if (EMAIL_ONLY) {
        await signInWithEmail(addr);
        success();
        onDone?.();
        return;
      }
      setMode(await sendCode(addr));
      setEmail(addr);
      setCode("");
      setWait(30);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) return setError("Enter the 6-digit code from your email");
    setBusy(true);
    setError(undefined);
    try {
      await verifyCode(email, code, mode!);
      success();
      onDone?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!mode) {
    return (
      <form noValidate onSubmit={send} className="flex flex-col gap-4">
        <Input
          id="signin-email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="priya@example.com"
          value={email}
          error={error}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(undefined);
          }}
        />
        <Button type="submit" size="lg" fullWidth loading={busy}>
          {EMAIL_ONLY ? "Continue" : "Send code"}
        </Button>
        {secondary}
      </form>
    );
  }

  return (
    <form noValidate onSubmit={verify} className="flex flex-col gap-4">
      <Input
        id="signin-code"
        label="6-digit code"
        helper={`We sent it to ${email}`}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={8}
        placeholder="123456"
        value={code}
        error={error}
        numeric={false}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, ""));
          setError(undefined);
        }}
      />
      <Button type="submit" size="lg" fullWidth loading={busy}>
        Verify
      </Button>
      <Button variant="ghost" size="lg" fullWidth disabled={wait > 0 || busy} onClick={() => void send()}>
        {wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
      </Button>
      <Button variant="ghost" size="lg" fullWidth onClick={() => setMode(null)}>
        Use a different email
      </Button>
    </form>
  );
}
