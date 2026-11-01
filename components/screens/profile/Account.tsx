"use client";

import { useState } from "react";
import { Card, DestructiveButton, useToast } from "@/components/ui";
import { SignInForm } from "@/components/profile/SignInForm";
import { PushedScreen } from "@/components/screens/Screen";
import { signOut, useAuth } from "@/lib/auth";
import { useNav } from "@/lib/nav";
import { isSyncConfigured } from "@/lib/sync";
import { useSyncInfo } from "@/lib/sync-engine";

export function AccountScreen() {
  const auth = useAuth();
  const sync = useSyncInfo();
  const nav = useNav();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!isSyncConfigured()) {
    return (
      <PushedScreen title="Account">
        <p className="text-sm text-soft">Accounts are not set up for this build.</p>
      </PushedScreen>
    );
  }

  return (
    <PushedScreen title="Account">
      {auth.status === "signedIn" ? (
        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-[13px] text-soft">Signed in as</p>
            <p className="mt-0.5 text-[17px] font-medium break-all">{auth.email}</p>
            <p className="mt-3 text-sm leading-relaxed text-soft">{sync.message}</p>
          </Card>
          <DestructiveButton
            size="lg"
            fullWidth
            confirmTitle="Sign out?"
            confirmDescription="Your invoices stay in your account. This phone's copy is removed, and you get it back when you sign in again."
            confirmLabel="Sign out"
            onConfirm={async () => {
              setBusy(true);
              setErr("");
              try {
                await signOut();
              } catch (e) {
                setErr((e as Error).message);
                setBusy(false);
              }
            }}
          >
            Sign out
          </DestructiveButton>
          {err ? <p className="text-sm text-warm">{err}</p> : null}
          {busy ? <p className="text-sm text-soft">Saving your latest changes…</p> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-[15px] leading-relaxed text-soft">
            {auth.status === "anonymous"
              ? "Your invoices are saved to this browser only. Add your email to keep them safe and open them on any phone."
              : "Enter your email to continue."}
          </p>
          <SignInForm
            onDone={() => {
              toast.show("Signed in");
              nav.pop();
            }}
          />
        </div>
      )}
    </PushedScreen>
  );
}
