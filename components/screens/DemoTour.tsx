"use client";

import { useMemo, useState } from "react";
import { CaretLeft, ChartBar, FilePdf, ListPlus, QrCode, Receipt, type Icon } from "@phosphor-icons/react";
import { Button, IconButton } from "@/components/ui";
import { InvoiceSheet } from "@/components/invoice/InvoiceSheet";
import { demoInvoiceView } from "@/lib/demo-invoice";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";

interface Slide {
  icon: Icon;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  { icon: ListPlus, title: "Add the work in seconds", text: "Pick a brand, tap a preset like Reel or Story, and enter the amount on the in-app keypad." },
  { icon: Receipt, title: "GST and TDS, worked out", text: "Billy picks CGST + SGST or IGST from the brand's state and shows the total in words." },
  { icon: QrCode, title: "Get paid faster", text: "Every invoice carries a UPI QR for the exact amount, plus your bank details." },
  { icon: ChartBar, title: "Know who owes you", text: "History shows what is pending, overdue or paid. Mark paid in one tap." },
  { icon: FilePdf, title: "A clean PDF, ready to share", text: "This is what a brand receives. Plain black on white, easy to print or forward." },
];

/** Skippable walkthrough shown from the welcome page. The last slide previews a sample invoice. */
export function DemoTour({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [i, setI] = useState(0);
  const view = useMemo(() => demoInvoiceView(), []);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i]!;

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="shrink-0 px-5 pt-[calc(var(--safe-top)+12px)]">
        <div className="flex h-11 items-center gap-2">
          <IconButton icon={CaretLeft} weight="bold" label={i === 0 ? "Back to welcome" : "Previous"} className="-ml-3" onClick={() => (i === 0 ? onBack() : setI(i - 1))} />
          <div className="flex flex-1 justify-center gap-1.5" role="progressbar" aria-label="Demo progress" aria-valuemin={1} aria-valuemax={SLIDES.length} aria-valuenow={i + 1}>
            {SLIDES.map((sl, n) => (
              <span key={sl.title} className={cn("h-1 flex-1 rounded-full transition-colors duration-200", n <= i ? "bg-ink" : "bg-line")} />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onDone}>
            Skip
          </Button>
        </div>
      </header>

      <div className="screen-scroll min-h-0 flex-1 px-6 pt-6">
        <span className="grid size-12 place-items-center rounded-key bg-tint text-ink">
          <s.icon size={26} aria-hidden />
        </span>
        <h1 className="mt-4 text-[28px] leading-tight font-semibold tracking-[-0.01em]">{s.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-soft">{s.text}</p>
        {last ? (
          <div className="mt-5 pb-4">
            <p className="mb-2 text-[12px] font-medium text-soft">Sample invoice</p>
            <InvoiceSheet view={view} />
          </div>
        ) : null}
      </div>

      <footer className="shrink-0 px-6 pt-3 pb-[calc(var(--safe-bottom)+24px)]">
        <Button
          size="lg"
          fullWidth
          onClick={() => {
            tap();
            if (last) onDone();
            else setI(i + 1);
          }}
        >
          {last ? "Start setup" : "Next"}
        </Button>
      </footer>
    </div>
  );
}
