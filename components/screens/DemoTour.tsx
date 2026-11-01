"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Buildings, CaretLeft, ChartBar, FilePdf, ListPlus, QrCode, Receipt, Sparkle, type Icon } from "@phosphor-icons/react";
import { Button, IconButton, SegmentedControl, StatusPill } from "@/components/ui";
import { InvoiceSheet } from "@/components/invoice/InvoiceSheet";
import { demoInvoiceView } from "@/lib/demo-invoice";
import { amountInWords } from "@/lib/amount-in-words";
import { formatINR } from "@/lib/format";
import { computeTotals } from "@/lib/tax";
import { upiQrDataUrl } from "@/lib/upi";
import { cn } from "@/lib/cn";
import { success, tap } from "@/lib/haptics";

interface Slide {
  icon: Icon;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  { icon: ListPlus, title: "Add the work in seconds", text: "Pick a brand, tap a preset like Reel or Story, and enter the amount on the in-app keypad." },
  { icon: Receipt, title: "GST and TDS, worked out", text: "CGST + SGST or IGST is picked from the brand's state and shows the total in words." },
  { icon: QrCode, title: "Get paid faster", text: "Every invoice carries a UPI QR for the exact amount, plus your bank details." },
  { icon: ChartBar, title: "Know who owes you", text: "History shows what is pending, overdue or paid. Mark paid in one tap." },
  { icon: FilePdf, title: "A clean PDF, ready to share", text: "This is what a brand receives. Plain black on white, easy to print or forward." },
];

const ITEMS = [
  { id: "1", label: "Instagram Reel", qty: 1, rate: 2500000 },
  { id: "2", label: "Story set", qty: 3, rate: 300000 },
];
const PRESETS = ["Instagram Reel", "Story set", "Static post"];

/** A mock card: same look as the real screens, not tappable. */
function Mock({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-note border border-line bg-white p-4" role="img" aria-label={label}>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function Row({ left, right, strong }: { left: ReactNode; right: ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1.5 text-[14px]", strong ? "font-semibold text-ink" : "text-soft")}>
      <span>{left}</span>
      <span className={cn("num", strong ? "text-[20px] text-ink" : "text-ink")}>{right}</span>
    </div>
  );
}

function AddWorkMock({ shown }: { shown: number }) {
  const lines = ITEMS.slice(0, shown);
  const total = computeTotals(lines.map((l) => ({ quantity: l.qty, rate: l.rate })), { gstMode: "none", gstRate: 0, showTds: false, tdsRate: null }).subtotal;
  return (
    <Mock label="Example of the new invoice screen with a brand, quick-add chips and line items">
      <p className="text-[12px] font-medium text-soft">Bill to</p>
      <div className="mt-1 flex min-h-12 items-center gap-3 rounded-key border border-line px-3">
        <Buildings size={20} className="text-soft" />
        <span className={cn("text-[15px]", shown ? "font-semibold text-ink" : "text-faint")}>{shown ? "Glow Naturals Pvt Ltd" : "Choose a brand"}</span>
      </div>
      <p className="mt-4 text-[12px] font-medium text-soft">Quick add</p>
      <div className="mt-1 flex gap-2 overflow-hidden">
        {PRESETS.map((p) => (
          <span key={p} className="inline-flex h-9 shrink-0 items-center rounded-full bg-tint px-3.5 text-[13px] font-semibold text-ink">
            + {p}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[12px] font-medium text-soft">Items</p>
      <div className="mt-1 min-h-[84px] divide-y divide-line rounded-key border border-line">
        {lines.length ? (
          lines.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[14px]">
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{l.label}</span>
                <span className="block text-[12px] text-soft">
                  {l.qty} × {formatINR(l.rate)}
                </span>
              </span>
              <span className="num text-ink">{formatINR(l.qty * l.rate)}</span>
            </div>
          ))
        ) : (
          <p className="px-3 py-8 text-center text-[13px] text-soft">No items yet</p>
        )}
      </div>
      <Row left="Subtotal" right={formatINR(total)} strong />
    </Mock>
  );
}

function GstMock() {
  const [mode, setMode] = useState<"intra" | "inter">("intra");
  const t = computeTotals(ITEMS.map((i) => ({ quantity: i.qty, rate: i.rate })), { gstMode: mode, gstRate: 18, showTds: true, tdsRate: 10 });
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl<"intra" | "inter">
        label="Brand's state"
        value={mode}
        onChange={setMode}
        segments={[
          { value: "intra", label: "Same state as you" },
          { value: "inter", label: "Different state" },
        ]}
      />
      <Mock label="Example of invoice totals with GST and TDS">
        <Row left="Subtotal" right={formatINR(t.subtotal)} />
        {mode === "intra" ? (
          <>
            <Row left="CGST @ 9%" right={formatINR(t.cgst)} />
            <Row left="SGST @ 9%" right={formatINR(t.sgst)} />
          </>
        ) : (
          <Row left="IGST @ 18%" right={formatINR(t.igst)} />
        )}
        <div className="my-1 border-t border-line" />
        <Row left="Total" right={formatINR(t.total)} strong />
        <p className="text-[12px] leading-relaxed text-soft">{amountInWords(t.total)}</p>
        <div className="mt-3 border-t border-line pt-2">
          <Row left="Expected TDS @ 10%" right={`(${formatINR(t.tds)})`} />
          <Row left="Net receivable" right={formatINR(t.netReceivable)} />
          <p className="text-[12px] text-soft">TDS is for reference only and never changes the total.</p>
        </div>
      </Mock>
    </div>
  );
}

function UpiMock() {
  const total = computeTotals(ITEMS.map((i) => ({ quantity: i.qty, rate: i.rate })), { gstMode: "intra", gstRate: 18, showTds: false, tdsRate: null }).total;
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    void upiQrDataUrl({ upiId: "priya@okaxis", name: "Priya Sharma", amount: total, note: "BLY/26-27/001" }).then((d) => !off && setQr(d));
    return () => {
      off = true;
    };
  }, [total]);
  return (
    <Mock label="Example of payment details with a UPI QR code for the exact amount">
      <div className="flex items-start gap-4">
        <div className="size-28 shrink-0 rounded-key border border-line p-1.5">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL
            <img src={qr} alt="" className="size-full" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-[13px]">
          <p className="text-soft">Scan to pay</p>
          <p className="num text-[22px] text-ink">{formatINR(total)}</p>
          <p className="mt-1 text-soft">Amount is filled in for you</p>
        </div>
      </div>
      <div className="mt-3 border-t border-line pt-2 text-[13px]">
        {[
          ["Account name", "Priya Sharma"],
          ["Account number", "123456789012"],
          ["IFSC", "HDFC0001234"],
          ["UPI", "priya@okaxis"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-0.5">
            <span className="text-soft">{k}</span>
            <span className="tabular text-ink">{v}</span>
          </div>
        ))}
      </div>
    </Mock>
  );
}

function TrackMock() {
  const rows = [
    { name: "Glow Naturals", sub: "Reel, 3 Story sets", num: "BLY/26-27/003 · 01 Nov", amt: 4012000, s: "pending" as const },
    { name: "Pepper Talent", sub: "Static post", num: "BLY/26-27/002 · 12 Oct", amt: 1180000, s: "overdue" as const },
    { name: "Urban Brew", sub: "Reel", num: "BLY/26-27/001 · 02 Oct", amt: 2950000, s: "paid" as const },
  ];
  return (
    <Mock label="Example of the invoice list with pending, overdue and paid statuses">
      <ul className="-my-2 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.name} className="flex items-start justify-between gap-3 py-3">
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold text-ink">{r.name}</span>
              <span className="block truncate text-[13px] text-soft">{r.sub}</span>
              <span className="mt-1 block truncate text-[12px] text-soft tabular">{r.num}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="num text-[17px] text-ink">{formatINR(r.amt)}</span>
              <StatusPill status={r.s} />
            </span>
          </li>
        ))}
      </ul>
    </Mock>
  );
}

/**
 * Skippable walkthrough shown from the welcome page. Each step shows what the
 * real screen looks like. "Fill demo values" adds a sample brand and items, and
 * the last step shows the finished invoice.
 */
export function DemoTour({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const view = useMemo(() => demoInvoiceView(), []);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i]!;
  const filled = shown >= ITEMS.length;

  // Reveal the sample brand and items one step at a time.
  useEffect(() => {
    if (shown === 0 || shown >= ITEMS.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 450);
    return () => clearTimeout(t);
  }, [shown]);

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

      <div className="screen-scroll min-h-0 flex-1 px-6 pt-5">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.01em]">{s.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-soft">{s.text}</p>
        <div className="mt-5 pb-6">
          {i === 0 ? (
            <div className="flex flex-col gap-4">
              <AddWorkMock shown={shown} />
              <Button
                variant={filled ? "tint" : "secondary"}
                size="lg"
                fullWidth
                icon={Sparkle}
                onClick={() => {
                  success();
                  setShown(filled ? 0 : 1);
                }}
              >
                {filled ? "Clear demo values" : "Fill demo values"}
              </Button>
            </div>
          ) : null}
          {i === 1 ? <GstMock /> : null}
          {i === 2 ? <UpiMock /> : null}
          {i === 3 ? <TrackMock /> : null}
          {last ? <InvoiceSheet view={view} /> : null}
        </div>
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
