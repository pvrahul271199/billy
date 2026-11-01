"use client";

import { FilePdf, QrCode, Receipt } from "@phosphor-icons/react";
import { Button } from "@/components/ui";
import { SignInForm } from "@/components/profile/SignInForm";
import { skipSignIn } from "@/lib/auth";

const POINTS = [
  { icon: Receipt, text: "GST and TDS worked out for you" },
  { icon: QrCode, text: "UPI QR on every invoice" },
  { icon: FilePdf, text: "Clean PDFs, shared in one tap" },
] as const;

/** First screen for a signed-out visitor: wordmark, what Billy does, then email. */
export function SignInScreen() {
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="screen-scroll min-h-0 flex-1 px-7 pt-[calc(var(--safe-top)+24px)] pb-[calc(var(--safe-bottom)+16px)]">
        <div className="flex min-h-full flex-col">
          <section className="my-auto py-8 pt-14">
            <h1 className="font-num text-[76px] leading-none font-semibold tracking-[-0.045em] text-ink opacity-80">Billy</h1>
            <p className="mt-5 max-w-[17rem] text-[18px] leading-snug font-medium text-ink">Invoices for creators, ready in a minute.</p>
            <ul className="mt-6 flex flex-col gap-3">
              {POINTS.map((p) => (
                <li key={p.text} className="flex items-center gap-3 text-[14px] text-soft">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-tint text-ink">
                    <p.icon size={16} aria-hidden />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SignInForm
              secondary={
                <Button variant="ghost" size="lg" fullWidth onClick={skipSignIn}>
                  Skip for now
                </Button>
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}
