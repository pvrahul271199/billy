"use client";

import { Button } from "@/components/ui";
import { SignInForm } from "@/components/profile/SignInForm";
import { skipSignIn } from "@/lib/auth";

/** First screen for a signed-out visitor. Email code only, with a way to skip. */
export function SignInScreen() {
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="screen-scroll min-h-0 flex-1 px-6 pt-[calc(var(--safe-top)+56px)] pb-8">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em]">Sign in to save your invoices</h1>
        <p className="mt-3 mb-8 text-[15px] leading-relaxed text-soft">
          Enter your email to continue. No password and no code while we test, and your invoices follow you to any phone.
        </p>
        <SignInForm
          secondary={
            <Button variant="ghost" size="lg" fullWidth onClick={skipSignIn}>
              Skip for now
            </Button>
          }
        />
      </div>
    </div>
  );
}
