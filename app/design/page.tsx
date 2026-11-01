"use client";

import { useState, type ReactNode } from "react";
import { CheckCircle, DownloadSimple, MagnifyingGlass, Plus, Receipt, ShareNetwork, WarningCircle } from "@phosphor-icons/react";
import {
  Amount,
  AmountField,
  Avatar,
  BottomSheet,
  Button,
  Card,
  Chip,
  DatePicker,
  DestructiveButton,
  Divider,
  EmptyState,
  IconButton,
  ImageUploader,
  Input,
  Keypad,
  ListGroup,
  ListRow,
  ScreenHeader,
  SegmentedControl,
  Select,
  StatusPill,
  Stepper,
  TabBar,
  Textarea,
  Toast,
  ToastProvider,
  Toggle,
  TopBar,
  applyKey,
  useToast,
  type ButtonVariant,
  type ForcedState,
  type KeypadKey,
} from "@/components/ui";
import { contrastRatio } from "@/lib/contrast";
import { formatINR } from "@/lib/format";
import type { Tab } from "@/lib/nav";
import { categoryRamp, colors } from "@/theme/tokens";
import type { DisplayStatus } from "@/types";

const TOKENS: Array<{ key: keyof typeof colors; css: string; use: string }> = [
  { key: "ink", css: "--ink", use: "Midnight indigo. Text, primary buttons, active icons" },
  { key: "ink2", css: "--ink2", use: "Secondary indigo. Soft highlights, outlines" },
  { key: "soft", css: "--soft", use: "Editorial slate. Labels, captions, secondary text" },
  { key: "faint", css: "--faint", use: "Muted lilac. Inactive icons, placeholders, ₹ symbols" },
  { key: "line", css: "--line", use: "Hairline dividers and borders" },
  { key: "tint", css: "--tint", use: "Chips, keys, card surfaces" },
  { key: "bg", css: "--bg", use: "Paper white background" },
  { key: "frame", css: "--frame", use: "Desktop canvas behind the phone" },
  { key: "good", css: "--good", use: "Deep indigo. Paid, on track" },
  { key: "goodBg", css: "--good-bg", use: "Soft lilac behind indigo" },
  { key: "warm", css: "--warm", use: "Roasted amber. Overdue, errors" },
  { key: "warmBg", css: "--warm-bg", use: "Soft peach behind amber" },
];

type Need = "text" | "ui" | "decorative";
const PAIRS: Array<{ fg: keyof typeof colors; bg: keyof typeof colors; where: string; need: Need }> = [
  { fg: "ink", bg: "bg", where: "Primary text", need: "text" },
  { fg: "ink", bg: "tint", where: "Text on chips, keys and cards", need: "text" },
  { fg: "soft", bg: "bg", where: "Labels and captions", need: "text" },
  { fg: "soft", bg: "tint", where: "Captions on cards, inactive chips", need: "text" },
  { fg: "bg", bg: "ink", where: "Primary button, toast, selected chip", need: "text" },
  { fg: "good", bg: "goodBg", where: "Paid pill", need: "text" },
  { fg: "warm", bg: "warmBg", where: "Overdue pill, overdue banner", need: "text" },
  { fg: "warm", bg: "bg", where: "Field errors, destructive buttons", need: "text" },
  { fg: "ink2", bg: "bg", where: "Pending pill outline", need: "ui" },
  { fg: "faint", bg: "bg", where: "Placeholders, inactive icons, ₹ symbol", need: "decorative" },
  { fg: "line", bg: "bg", where: "Hairlines (paired with labels)", need: "decorative" },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-4">
      <h2 id={id} className="text-[22px] font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {intro ? <p className="mt-1 max-w-prose text-[14px] text-soft">{intro}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[12px] font-semibold text-soft">{children}</p>;
}

function Verdict({ ratio, need }: { ratio: number; need: Need }) {
  if (need === "decorative") return <span className="text-soft">Not for reading text</span>;
  const min = need === "text" ? 4.5 : 3;
  const pass = ratio >= min;
  const Icon = pass ? CheckCircle : WarningCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold ${pass ? "text-good" : "text-warm"}`}>
      <Icon size={16} weight="bold" aria-hidden="true" />
      {pass ? (need === "text" ? "Passes AA" : "Passes AA (3:1 UI)") : "Below AA"}
    </span>
  );
}

const STATES: Array<{ label: string; force?: ForcedState; disabled?: boolean; loading?: boolean }> = [
  { label: "Default" },
  { label: "Hover", force: "hover" },
  { label: "Pressed", force: "pressed" },
  { label: "Focus", force: "focus" },
  { label: "Disabled", disabled: true },
  { label: "Loading", loading: true },
];

function Showcase() {
  const toast = useToast();
  const [sheet, setSheet] = useState(false);
  const [gst, setGst] = useState(true);
  const [segment, setSegment] = useState<"brand" | "agency">("brand");
  const [filter, setFilter] = useState<DisplayStatus | "all">("all");
  const [photo, setPhoto] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(2500000);
  const [qty, setQty] = useState(2);
  const [typed, setTyped] = useState("48500");
  const [tab, setTab] = useState<Tab>("invoice");
  const [state, setState] = useState("");

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-32">
      <header className="mb-10">
        <p className="text-[13px] font-semibold text-soft">Billy</p>
        <h1 className="mt-1 text-[34px] leading-tight font-semibold tracking-[-0.02em]">Design system</h1>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-soft">
          Calm, clear, zero anxiety. Midnight indigo on paper white, hairlines instead of shadows, and indigo and amber for
          status. Status is always an icon and a word, never colour alone.
        </p>
        <p className="mt-3">
          <a href="/" className="text-[14px] font-semibold text-ink underline underline-offset-4">
            Open the app
          </a>
        </p>
      </header>

      <div className="flex flex-col gap-14">
        <Section id="colour" title="Colour" intro="Tokens live in theme/tokens.ts and app/globals.css. Components never use hex values.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TOKENS.map((t) => (
              <li key={t.key} className="overflow-hidden rounded-note border border-line">
                <div className="h-14 border-b border-line" style={{ background: `var(${t.css})` }} />
                <div className="p-3">
                  <p className="text-[13px] font-semibold">{t.key}</p>
                  <p className="text-[12px] text-soft uppercase tabular">{colors[t.key]}</p>
                  <p className="mt-1 text-[12px] leading-snug text-soft">{t.use}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Label>Category ramp (charts and breakdowns)</Label>
            <div className="flex h-10 overflow-hidden rounded-full border border-line">
              {categoryRamp.map((c, i) => (
                <span key={c} className="flex-1" style={{ background: c }} title={`${i + 1}: ${c}`} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="contrast" title="Contrast" intro="AA needs 4.5:1 for text and 3:1 for UI outlines. Faint and line are kept for decoration and placeholders.">
          <div className="screen-scroll overflow-x-auto rounded-note border border-line">
            <table className="w-full min-w-[600px] text-left text-[13px]">
              <thead className="bg-tint">
                <tr>
                  {["Sample", "Pair", "Used for", "Ratio", "Result"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {PAIRS.map((p) => {
                  const ratio = contrastRatio(colors[p.fg], colors[p.bg]);
                  return (
                    <tr key={p.fg + p.bg}>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex h-8 w-12 items-center justify-center rounded-[8px] border border-line font-semibold"
                          style={{ color: colors[p.fg], background: colors[p.bg] }}
                        >
                          Aa
                        </span>
                      </td>
                      <td className="px-4 py-3 text-soft">
                        {p.fg} on {p.bg}
                      </td>
                      <td className="px-4 py-3">{p.where}</td>
                      <td className="px-4 py-3 tabular">{ratio.toFixed(2)}:1</td>
                      <td className="px-4 py-3">
                        <Verdict ratio={ratio} need={p.need} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="type" title="Typography" intro="Figtree for interface and prose. Bricolage Grotesque with tabular figures for every amount.">
          <div className="flex flex-col gap-5">
            <div>
              <Label>Display amount · Bricolage 56</Label>
              <p className="text-[56px] leading-none">
                <Amount value={formatINR(14550000)} />
              </p>
            </div>
            <div>
              <Label>Keypad display · Bricolage 44</Label>
              <p className="num text-[44px] leading-none">48,500</p>
            </div>
            <div>
              <Label>Large title · Figtree 28 / 600</Label>
              <p className="text-[28px] font-semibold tracking-[-0.01em]">History</p>
            </div>
            <div>
              <Label>Section title · Figtree 17 / 600</Label>
              <p className="text-[17px] font-semibold">Line items</p>
            </div>
            <div>
              <Label>Body · Figtree 15</Label>
              <p className="text-[15px]">Bill brands for Reels, Stories and posts in a minute.</p>
            </div>
            <div>
              <Label>Caption · Figtree 13 / soft</Label>
              <p className="text-[13px] text-soft">Due on 15 Nov 2026</p>
            </div>
            <div>
              <Label>Tabular figures</Label>
              <div className="num inline-flex flex-col items-end text-[18px]">
                <span>{formatINR(11111100)}</span>
                <span>{formatINR(4850000)}</span>
                <span>{formatINR(90000)}</span>
              </div>
            </div>
          </div>
        </Section>

        <Section id="surface" title="Radii and surfaces" intro="Apple-grade curvature. Hairlines separate layers; only floating overlays get a soft indigo shadow.">
          <div className="flex flex-wrap items-end gap-5">
            {[
              ["rounded-phone", "40 · phone"],
              ["rounded-sheet", "28 · sheet"],
              ["rounded-btn", "16 · button"],
              ["rounded-key", "14 · key, card"],
              ["rounded-full", "full · pill"],
            ].map(([cls, label]) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`h-16 w-24 border border-line bg-tint ${cls}`} />
                <span className="text-[12px] text-soft">{label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-24 rounded-key bg-white shadow-float" />
              <span className="text-[12px] text-soft">Float shadow</span>
            </div>
          </div>
        </Section>

        <Section id="buttons" title="Buttons" intro="One primary per screen, placed in the thumb zone. Destructive actions always confirm.">
          <div className="screen-scroll overflow-x-auto rounded-note border border-line">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="bg-tint">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Variant
                  </th>
                  {STATES.map((s) => (
                    <th key={s.label} scope="col" className="px-3 py-3 font-semibold">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(["primary", "secondary", "tint", "ghost"] as ButtonVariant[]).map((v) => (
                  <tr key={v}>
                    <th scope="row" className="px-4 py-4 font-medium capitalize">
                      {v}
                    </th>
                    {STATES.map((s) => (
                      <td key={s.label} className="px-3 py-4">
                        <Button variant={v} forceState={s.force} disabled={s.disabled} loading={s.loading}>
                          Save
                        </Button>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-4 py-4 font-medium">
                    Destructive
                  </th>
                  {STATES.map((s) => (
                    <td key={s.label} className="px-3 py-4">
                      {s.loading ? (
                        <span className="text-soft">In dialog</span>
                      ) : (
                        <DestructiveButton
                          forceState={s.force}
                          disabled={s.disabled}
                          confirmTitle="Delete this invoice?"
                          confirmDescription="BLY/26-27/004 will be removed from this device. You can undo right after."
                          confirmLabel="Delete invoice"
                          onConfirm={() => toast.show("Invoice deleted")}
                        >
                          Delete
                        </DestructiveButton>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Sizes</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="tint">
                  Small
                </Button>
                <Button size="md" variant="tint">
                  Medium
                </Button>
                <Button size="lg" variant="tint">
                  Large
                </Button>
              </div>
            </div>
            <div>
              <Label>With icon · icon only</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="tint" icon={DownloadSimple}>
                  Download
                </Button>
                <IconButton icon={ShareNetwork} label="Share" />
                <IconButton icon={MagnifyingGlass} label="Search" forceState="focus" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label>Full width</Label>
              <Button fullWidth size="lg" icon={Plus}>
                New invoice
              </Button>
            </div>
          </div>
        </Section>

        <Section id="inputs" title="Inputs" intro="Hairline borders that darken to ink on focus. Errors use amber with an icon and a sentence.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" placeholder="Riya Sharma" />
            <Input label="Email" placeholder="riya@studio.in" forceState="focus" helper="Focus state" />
            <Input label="IFSC" defaultValue="HDFC00012" error="IFSC needs 11 characters" />
            <Input label="PAN" defaultValue="ABCDE1234F" disabled helper="Disabled" />
            <Input label="Instagram username" prefix="@" placeholder="riya.creates" />
            <Input label="Phone" prefix="+91" placeholder="9876543210" />
            <Select
              label="State"
              placeholder="Choose a state"
              options={[
                { value: "27", label: "Maharashtra" },
                { value: "29", label: "Karnataka" },
              ]}
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
            <DatePicker label="Invoice date" defaultValue="2026-10-31" />
            <div className="sm:col-span-2">
              <Textarea label="Notes and terms" optional placeholder="Payment within 15 days. Usage rights for 3 months from posting date." />
            </div>
          </div>
        </Section>

        <Section id="keypad" title="Keypad, amount and stepper" intro="Money is entered on an in-app keypad so the phone keyboard never pushes the layout around.">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="flex flex-col gap-4">
              <AmountField label="Rate" value={amount} onChange={setAmount} helper="Tap to open the keypad" />
              <AmountField label="Rate" value={null} onChange={() => {}} error="Add a rate" />
              <Stepper label="Qty" value={qty} onChange={setQty} />
            </div>
            <div className="rounded-sheet border border-line p-4">
              <p className="num py-3 text-center text-[44px] leading-none">
                <span className="text-[26px] text-faint">₹</span>
                {Number(typed || "0").toLocaleString("en-IN")}
              </p>
              <Keypad onKey={(k: KeypadKey) => setTyped((d) => applyKey(d, k))} />
            </div>
          </div>
        </Section>

        <Section id="selection" title="Toggles, segments and chips">
          <div className="grid gap-8 sm:grid-cols-2">
            <Card className="flex flex-col py-1">
              <Toggle label="I am GST registered" description="Adds GST and titles the document Tax Invoice" checked={gst} onChange={setGst} />
              <Divider />
              <Toggle label="Include UPI QR" checked={false} onChange={() => {}} forceState="focus" />
              <Divider />
              <Toggle label="Include signature" description="Disabled" checked disabled onChange={() => {}} />
            </Card>
            <div className="flex flex-col gap-6">
              <div>
                <Label>Segmented control</Label>
                <SegmentedControl
                  label="Type"
                  value={segment}
                  onChange={setSegment}
                  segments={[
                    { value: "brand", label: "Brand" },
                    { value: "agency", label: "Agency" },
                  ]}
                />
              </div>
              <div>
                <Label>Filter pills</Label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "draft", "pending", "overdue", "paid"] as const).map((f) => (
                    <Chip key={f} selected={filter === f} onClick={() => setFilter(f)} className="capitalize">
                      {f}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Quick-add chips</Label>
                <div className="flex flex-wrap gap-2">
                  {["Instagram Reel", "Story set", "Carousel"].map((c) => (
                    <Chip key={c} icon={Plus}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="status" title="Status" intro="Muted, dignified tones. No alarm reds.">
          <div className="flex flex-wrap gap-3">
            {(["draft", "pending", "overdue", "paid"] as const).map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </div>
          <div className="mt-5 flex w-full max-w-sm items-center gap-2.5 rounded-key bg-warm-bg px-3.5 py-3 text-[14px] font-medium text-warm">
            <WarningCircle size={20} weight="bold" aria-hidden="true" />
            <span>
              <span className="num">{formatINR(6903000)}</span> overdue across 1 invoice
            </span>
          </div>
        </Section>

        <Section id="surfaces" title="Cards and lists">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Card>
                <p className="text-[13px] font-medium text-soft">Tint card</p>
                <p className="mt-1 text-[32px] leading-none">
                  <Amount value={formatINR(7500000)} />
                </p>
              </Card>
              <Card tone="outline">
                <p className="text-[13px] font-medium text-soft">Outline card</p>
                <p className="mt-1 text-[15px]">Hairline border, no shadow.</p>
              </Card>
            </div>
            <ListGroup label="List rows">
              <ListRow icon={Receipt} title="Invoice number prefix" value="BLY" onClick={() => {}} />
              <ListRow icon={Receipt} title="Creator details" description="Riya Sharma · @riya.creates" onClick={() => {}} />
              <ListRow icon={Receipt} title="Unavailable row" disabled />
            </ListGroup>
            <div className="rounded-note border border-line sm:col-span-2">
              <EmptyState
                icon={Receipt}
                title="Your invoices will live here"
                description="Bill your first brand collab and track what's pending and paid."
                action={<Button>Create your first invoice</Button>}
              />
            </div>
          </div>
        </Section>

        <Section id="overlays" title="Feedback and overlays" intro="Toasts drop in below the status bar. Sheets and dialogs are frosted, dismiss on outside tap or Esc, and trap focus.">
          <div className="flex flex-col gap-3">
            <Toast message="Invoice saved as draft" />
            <Toast message="Marked as paid" action={{ label: "Undo", onClick: () => {} }} />
            <div className="flex flex-wrap gap-2">
              <Button variant="tint" onClick={() => toast.show("Invoice saved as draft")}>
                Show toast
              </Button>
              <Button variant="tint" onClick={() => setSheet(true)}>
                Open bottom sheet
              </Button>
              <DestructiveButton
                confirmTitle="Delete this brand?"
                confirmDescription="Past invoices keep their copy of the brand's details."
                confirmLabel="Delete brand"
                onConfirm={() => toast.show("Brand deleted")}
              >
                Delete brand
              </DestructiveButton>
            </div>
          </div>
          <BottomSheet
            open={sheet}
            onClose={() => setSheet(false)}
            title="Bill to"
            footer={
              <Button fullWidth size="lg" icon={Plus} onClick={() => setSheet(false)}>
                Add brand
              </Button>
            }
          >
            <ListGroup>
              {["Mamaearth", "boAt Lifestyle", "Nykaa", "Pepper Talent"].map((b) => (
                <ListRow key={b} title={b} chevron={false} onClick={() => setSheet(false)} />
              ))}
            </ListGroup>
          </BottomSheet>
        </Section>

        <Section id="images" title="Images and avatars">
          <div className="grid gap-6 sm:grid-cols-3">
            <ImageUploader label="Profile photo" kind="photo" value={photo} onChange={setPhoto} />
            <ImageUploader label="Logo" kind="logo" value={logo} onChange={setLogo} />
            <ImageUploader label="Signature" kind="signature" value={signature} onChange={setSignature} helper="Paper background is removed" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Avatar name="Riya Sharma" size="sm" />
            <Avatar name="Riya Sharma" />
            <Avatar name="Riya Sharma" size="lg" src={photo} />
          </div>
        </Section>

        <Section id="nav" title="Navigation" intro="Tabs switch with state, no page loads. Pushed screens get a compact bar with back.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="overflow-hidden rounded-note border border-line">
              <ScreenHeader title="Pending" subtitle="Hi Riya" />
              <div className="h-4" />
            </div>
            <div className="overflow-hidden rounded-note border border-line">
              <TopBar preview title="BLY/26-27/004" onBack={() => {}} actions={<IconButton icon={ShareNetwork} label="Share" />} />
            </div>
            <div className="overflow-hidden rounded-note border border-line sm:col-span-2">
              <TabBar preview active={tab} onChange={setTab} />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

export default function DesignPage() {
  return (
    <div className="screen-scroll relative h-dvh">
      <ToastProvider fixed>
        <Showcase />
        <div id="app-overlays" className="pointer-events-none fixed inset-0 z-50" />
      </ToastProvider>
    </div>
  );
}
