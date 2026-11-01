"use client";

import { useRef, useState } from "react";
import { CaretLeft, FilePdf, ListPlus, UserCircle } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui";
import { BankForm, CreatorForm, ImageFields, TaxForm, type ImageValues } from "@/components/profile/forms";
import { now, savePayment, saveProfile, seedPresetsIfEmpty } from "@/db";
import { usePayment, useProfile } from "@/db/queries";
import { cn } from "@/lib/cn";
import { success } from "@/lib/haptics";
import { DemoTour } from "./DemoTour";
import { Splash } from "./Screen";

const STEPS = [
  { title: "Your details", intro: "This goes on every invoice you send. Only your name is needed now." },
  { title: "Tax", intro: "Set this once and Billy works out GST on each invoice." },
  { title: "Payment", intro: "Where brands pay you. Invoices get a UPI QR for the exact amount." },
] as const;

/** First-launch setup. When it finishes, the app shell swaps to the tabs on its own. */
export function OnboardingScreen() {
  const profile = useProfile();
  const payment = usePayment();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"welcome" | "demo" | "setup">("welcome");
  const [images, setImages] = useState<ImageValues | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  if (!profile || !payment) return <Splash />;

  const imageValues = images ?? { photo: profile.photo, logo: profile.logo, signature: profile.signature };
  const go = (n: number) => {
    setStep(n);
    scroller.current?.scrollTo({ top: 0 });
  };

  async function finish() {
    await seedPresetsIfEmpty();
    await saveProfile({ onboardedAt: now() });
    success();
  }

  const skip = (onClick: () => void) => (
    <Button variant="ghost" size="lg" fullWidth onClick={onClick}>
      Skip for now
    </Button>
  );

  const current = STEPS[step]!;

  if (phase === "welcome") return <Welcome onStart={() => setPhase("setup")} onDemo={() => setPhase("demo")} />;
  if (phase === "demo") return <DemoTour onDone={() => setPhase("setup")} onBack={() => setPhase("welcome")} />;

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="shrink-0 px-5 pt-[calc(var(--safe-top)+12px)]">
        <div className="flex h-11 items-center gap-2">
          {step > 0 ? <IconButton icon={CaretLeft} weight="bold" label="Back" className="-ml-3" onClick={() => go(step - 1)} /> : null}
          <div
            className="grid flex-1 grid-cols-3 gap-1.5"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${current.title}`}
          >
            {STEPS.map((s, i) => (
              <span key={s.title} className={cn("h-1 rounded-full transition-colors duration-200", i <= step ? "bg-ink" : "bg-line")} />
            ))}
          </div>
        </div>
        <p className="mt-4 text-[13px] font-medium text-soft">
          Step {step + 1} of {STEPS.length}
        </p>
        <h1 className="mt-0.5 text-[28px] leading-tight font-semibold tracking-[-0.01em]">{current.title}</h1>
        <p className="mt-1.5 pb-4 text-[14px] leading-relaxed text-soft">{current.intro}</p>
      </header>

      <div ref={scroller} className="screen-scroll min-h-0 flex-1 px-5 pt-2 pb-[calc(var(--safe-bottom)+24px)]">
        {step === 0 ? (
          <CreatorForm
            initial={profile}
            submitLabel="Continue"
            onSubmit={async (v) => {
              await saveProfile({ ...v, ...imageValues });
              go(1);
            }}
          >
            <ImageFields value={imageValues} onChange={setImages} />
          </CreatorForm>
        ) : null}
        {step === 1 ? (
          <TaxForm
            initial={profile}
            pan={profile.pan}
            submitLabel="Continue"
            secondary={skip(() => go(2))}
            onSubmit={async (v) => {
              await saveProfile(v);
              go(2);
            }}
          />
        ) : null}
        {step === 2 ? (
          <BankForm
            initial={payment}
            submitLabel="Finish setup"
            secondary={skip(() => void finish())}
            onSubmit={async (v) => {
              await savePayment(v);
              await finish();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

const HOW = [
  { icon: UserCircle, title: "Set up once", text: "Add your name, tax and payment details. Takes about a minute." },
  { icon: ListPlus, title: "Add the work", text: "Pick the brand, tap in the Reel or post, and enter the amount." },
  { icon: FilePdf, title: "Send the PDF", text: "A clean invoice with GST and a UPI QR, shared in one tap." },
] as const;

function Welcome({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="screen-scroll min-h-0 flex-1 px-6 pt-[calc(var(--safe-top)+48px)]">
        <p className="text-[13px] font-semibold text-soft">Billy</p>
        <h1 className="mt-2 text-[34px] leading-[1.1] font-semibold tracking-[-0.02em]">Invoices for creators, made simple</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-soft">
          Bill brands for Reels, posts and Stories in under a minute. Works offline, and your data stays on your phone.
        </p>
        <ol className="mt-8 space-y-5">
          {HOW.map((h, i) => (
            <li key={h.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-key bg-tint text-ink">
                <h.icon size={22} weight="regular" aria-hidden />
              </span>
              <div>
                <p className="text-[15px] font-semibold">
                  {i + 1}. {h.title}
                </p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-soft">{h.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <footer className="shrink-0 px-6 pt-3 pb-[calc(var(--safe-bottom)+24px)]">
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={onStart}>
            Get started
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onDemo}>
            Show me a demo
          </Button>
        </div>
      </footer>
    </div>
  );
}
