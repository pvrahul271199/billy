"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretRight, Eye, Info } from "@phosphor-icons/react";
import {
  Button,
  Card,
  DatePicker,
  DestructiveButton,
  Divider,
  FieldError,
  Input,
  Select,
  Textarea,
  Toggle,
  useToast,
} from "@/components/ui";
import { BrandPicker } from "@/components/invoice/BrandPicker";
import { LineItemsEditor, type ItemErrors } from "@/components/invoice/LineItemsEditor";
import { TotalsCard } from "@/components/invoice/TotalsCard";
import { PushedScreen, Splash } from "./Screen";
import { useNav } from "@/lib/nav";
import { allInvoiceNumbers, db, deleteKV, getKV, newInvoice, now, refreezeSnapshots, saveInvoice, setKV } from "@/db";
import { PAYMENT_TERM_OPTIONS, dueDateFor } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { useParties, usePayment, usePresets, useProfile } from "@/db/queries";
import { buildInvoiceView } from "@/lib/invoice-view";
import { parsePercent } from "@/lib/money";
import { invoiceNumberError, nextInvoiceNumber } from "@/lib/numbering";
import { stateName } from "@/lib/states";
import { DEFAULT_GST_RATE, computeTotals, gstModeFor } from "@/lib/tax";
import { cn } from "@/lib/cn";
import type { Invoice, Party, PaymentTerms } from "@/types";

const AUTOSAVE_KEY = "invoiceForm";

interface FormDraft {
  invoice: Invoice;
  numberEdited: boolean;
  savedAt: string;
}

interface EditorErrors {
  number?: string;
  billTo?: string;
  endBrandName?: string;
  items?: string;
  dueDate?: string;
  gstRate?: string;
  tdsRate?: string;
  itemErrors?: Record<string, ItemErrors>;
}

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div>
        <h2 id={id} className="text-[17px] font-semibold">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-sm text-soft">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function InlineError({ id, children }: { id?: string; children: React.ReactNode }) {
  return <FieldError id={id}>{children}</FieldError>;
}

/** Invoice form, pushed on top of the tabs. `id` edits an existing invoice. */
export function EditorScreen({ id }: { id?: string }) {
  const nav = useNav();
  const toast = useToast();
  const profile = useProfile();
  const payment = usePayment();
  const parties = useParties();
  const presets = usePresets();

  const [inv, setInv] = useState<Invoice | null>(null);
  const [numberEdited, setNumberEdited] = useState(false);
  const [existsInDb, setExistsInDb] = useState(false);
  const [errors, setErrors] = useState<EditorErrors>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [gstRateText, setGstRateText] = useState("");
  const [tdsText, setTdsText] = useState("");
  const [saving, setSaving] = useState<"draft" | "preview" | null>(null);
  const dirty = useRef(false);

  // ------------------------------------------------------------ load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await getKV<FormDraft>(AUTOSAVE_KEY);
      let loaded: { invoice: Invoice; numberEdited: boolean } | null = null;
      if (id) {
        const rec = await db.invoices.get(id);
        if (!rec || rec.deletedAt) {
          nav.pop();
          return;
        }
        if (draft && draft.invoice.id === id && draft.savedAt > rec.updatedAt) {
          loaded = draft;
          toast.show("Restored your unsaved changes");
        } else {
          loaded = { invoice: rec, numberEdited: true };
        }
        if (!cancelled) setExistsInDb(true);
      } else if (draft && !(await db.invoices.get(draft.invoice.id))) {
        loaded = draft;
        toast.show("Restored your unsaved invoice");
      } else {
        loaded = { invoice: await newInvoice(), numberEdited: false };
      }
      if (cancelled) return;
      setInv(loaded.invoice);
      setNumberEdited(loaded.numberEdited);
      setGstRateText(String(loaded.invoice.gstRate || DEFAULT_GST_RATE));
      setTdsText(loaded.invoice.tdsRate === null ? "" : String(loaded.invoice.tdsRate));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per id
  }, [id]);

  // ------------------------------------------------------------ autosave
  useEffect(() => {
    if (!inv || !dirty.current) return;
    const t = setTimeout(() => {
      void setKV(AUTOSAVE_KEY, { invoice: inv, numberEdited, savedAt: now() } satisfies FormDraft);
    }, 400);
    return () => clearTimeout(t);
  }, [inv, numberEdited]);

  const party = useMemo(() => parties?.find((p) => p.id === inv?.billToId), [parties, inv?.billToId]);

  // Drafts follow the current GST registration and the brand's state.
  const derivedMode = profile ? gstModeFor(profile.gstRegistered, profile.address.stateCode, party?.address.stateCode ?? "") : null;
  useEffect(() => {
    if (!inv || !derivedMode || inv.status !== "draft" || inv.gstMode === derivedMode) return;
    setInv({
      ...inv,
      gstMode: derivedMode,
      gstRate: derivedMode === "none" ? 0 : inv.gstRate || parsePercent(gstRateText) || DEFAULT_GST_RATE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedMode, inv?.status]);

  const view = useMemo(
    () => (inv && profile && payment ? buildInvoiceView(inv, { profile, payment, party }) : null),
    [inv, profile, payment, party],
  );

  if (!inv || !profile || !payment || !parties || !presets || !view) return <Splash />;

  // ------------------------------------------------------------ updates
  const update = (patch: Partial<Invoice>) => {
    dirty.current = true;
    setInv((prev) => (prev ? { ...prev, ...patch } : prev));
  };
  const clearError = (k: keyof EditorErrors) => setErrors((e) => ({ ...e, [k]: undefined }));

  async function changeInvoiceDate(date: string) {
    if (!inv || !date) return;
    const patch: Partial<Invoice> = { invoiceDate: date, dueDate: dueDateFor(inv.paymentTerms, date, inv.dueDate) };
    if (!numberEdited && profile) {
      patch.number = nextInvoiceNumber(profile.invoicePrefix, date, await allInvoiceNumbers(inv.id));
    }
    update(patch);
    clearError("dueDate");
  }

  function changeTerms(terms: PaymentTerms) {
    if (!inv) return;
    update({ paymentTerms: terms, dueDate: dueDateFor(terms, inv.invoiceDate, inv.dueDate) });
    clearError("dueDate");
  }

  function changeDueDate(date: string) {
    if (!inv) return;
    const implied = dueDateFor(inv.paymentTerms, inv.invoiceDate, inv.dueDate);
    update({ dueDate: date, paymentTerms: inv.paymentTerms !== "custom" && date !== implied ? "custom" : inv.paymentTerms });
    clearError("dueDate");
  }

  function pickParty(p: Party) {
    update({ billToId: p.id, billToSnapshot: null });
    clearError("billTo");
  }

  // ------------------------------------------------------------ validation
  async function validate(full: boolean): Promise<EditorErrors> {
    if (!inv) return {};
    const e: EditorErrors = {};
    e.number = invoiceNumberError(inv.number, await allInvoiceNumbers(inv.id)) ?? undefined;
    if (full) {
      if (!inv.billToId) e.billTo = "Choose who you're billing";
      if (inv.viaAgency && !inv.endBrandName.trim()) e.endBrandName = "Add the brand this campaign is for";
      if (inv.dueDate && inv.dueDate < inv.invoiceDate) e.dueDate = "Due date can't be before the invoice date";
      if (inv.items.length === 0) e.items = "Add at least one item";
      const itemErrors: Record<string, ItemErrors> = {};
      for (const it of inv.items) {
        const ie: ItemErrors = {};
        if (!it.description.trim()) ie.description = "Describe this item";
        if (!it.rate) ie.rate = "Add a rate";
        if (ie.description || ie.rate) itemErrors[it.id] = ie;
      }
      if (Object.keys(itemErrors).length) e.itemErrors = itemErrors;
    }
    if (inv.gstMode !== "none" && parsePercent(gstRateText) === null) e.gstRate = "Enter a GST rate between 0 and 100";
    if (inv.showTds && parsePercent(tdsText) === null) e.tdsRate = "Enter a TDS rate, or turn off expected TDS";
    return e;
  }

  function focusFirst(e: EditorErrors) {
    const order: Array<[keyof EditorErrors, string]> = [
      ["number", "inv-number"],
      ["dueDate", "inv-due"],
      ["billTo", "inv-billto"],
      ["endBrandName", "inv-endbrand"],
      ["items", "inv-items"],
    ];
    for (const [k, elId] of order) {
      if (e[k]) return document.getElementById(elId)?.focus();
    }
    const firstItem = inv?.items.find((i) => e.itemErrors?.[i.id]);
    if (firstItem) {
      const ie = e.itemErrors![firstItem.id]!;
      return document.getElementById(`item-${firstItem.id}-${ie.description ? "description" : "rate"}`)?.focus();
    }
    if (e.gstRate) return document.getElementById("inv-gst")?.focus();
    if (e.tdsRate) return document.getElementById("inv-tds")?.focus();
  }

  async function persist(mode: "draft" | "preview") {
    if (!inv) return;
    setSaving(mode);
    try {
      const e = await validate(mode === "preview");
      const has = Object.entries(e).some(([, v]) => v);
      setErrors(e);
      if (has) {
        focusFirst(e);
        toast.show(mode === "preview" ? "A few things need fixing before preview" : "Fix the invoice number to save");
        return;
      }
      const record: Invoice = {
        ...inv,
        number: inv.number.trim(),
        gstRate: inv.gstMode === "none" ? 0 : (parsePercent(gstRateText) ?? DEFAULT_GST_RATE),
        tdsRate: parsePercent(tdsText),
      };
      await saveInvoice(record);
      if (record.status !== "draft") await refreezeSnapshots(record.id);
      await deleteKV(AUTOSAVE_KEY);
      dirty.current = false;
      if (mode === "preview") {
        nav.push({ name: "preview", id: record.id });
      } else {
        toast.show(record.status === "draft" ? "Draft saved" : "Changes saved");
        setExistsInDb(true);
        if (!id) nav.replace({ name: "editor", id: record.id });
      }
    } finally {
      setSaving(null);
    }
  }

  // ------------------------------------------------------------ render
  const totals = computeTotals(inv.items, { ...inv, gstRate: parsePercent(gstRateText) ?? 0, tdsRate: parsePercent(tdsText) });
  // Reflect rates as typed, before they're committed on save.
  const liveView = buildInvoiceView(
    { ...inv, gstRate: parsePercent(gstRateText) ?? 0, tdsRate: parsePercent(tdsText) },
    { profile, payment, party },
  );
  const sent = inv.status !== "draft";
  const hasBank = !!(payment.accountNumber && payment.ifsc);
  const hasUpi = !!(payment.upiId || payment.staticQr);
  const creatorState = stateName(profile.address.stateCode);
  const partyState = party ? stateName(party.address.stateCode) : "";

  let gstExplain = "";
  if (inv.gstMode === "intra") {
    gstExplain = !party
      ? "CGST + SGST until you pick who you're billing."
      : !partyState || !creatorState
        ? `CGST + SGST. Add ${!partyState ? `${party.name}'s state` : "your state in Profile"} to confirm.`
        : `CGST + SGST: ${party.name} is in ${partyState}, same as you.`;
  } else if (inv.gstMode === "inter") {
    gstExplain = `IGST: ${party?.name ?? "The brand"} is in ${partyState} and you're in ${creatorState}.`;
  }

  return (
    <PushedScreen
      title={existsInDb ? (sent ? `Edit ${inv.number}` : "Edit invoice") : "New invoice"}
      padded={false}
      actions={
        <Button variant="ghost" size="sm" loading={saving === "draft"} onClick={() => void persist("draft")}>
          {sent ? "Save" : "Save draft"}
        </Button>
      }
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1" aria-live="polite">
            <p className="text-[12px] font-medium text-soft">Total</p>
            <p className="num truncate text-[24px] leading-tight text-ink">{formatINR(totals.total)}</p>
          </div>
          <Button icon={Eye} size="lg" loading={saving === "preview"} onClick={() => void persist("preview")}>
            Preview
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-8 px-4 pt-5 pb-8">
        {sent ? (
          <Card className="flex gap-3 text-sm leading-relaxed">
            <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>
              This invoice was already sent. After saving, share the updated PDF with {party?.name ?? "the brand"} so you both
              have the same version.
            </p>
          </Card>
        ) : null}

        {/* ---------------------------------------------------- details */}
        <Section id="sec-details" title="Details">
          <Input
            id="inv-number"
            label="Invoice number"
            value={inv.number}
            maxLength={16}
            autoCapitalize="characters"
            error={errors.number}
            helper={numberEdited ? undefined : "Next in sequence for this financial year"}
            onChange={(e) => {
              setNumberEdited(true);
              update({ number: e.target.value.replace(/\s/g, "") });
              clearError("number");
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="Invoice date" value={inv.invoiceDate} onChange={(e) => void changeInvoiceDate(e.target.value)} />
            <Select
              label="Payment terms"
              value={inv.paymentTerms}
              options={PAYMENT_TERM_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
              onChange={(e) => changeTerms(e.target.value as PaymentTerms)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              id="inv-due"
              label="Due date"
              value={inv.dueDate}
              min={inv.invoiceDate}
              error={errors.dueDate}
              onChange={(e) => changeDueDate(e.target.value)}
            />
            <DatePicker
              label="Delivered on"
              optional
              value={inv.deliveryDate}
              onChange={(e) => update({ deliveryDate: e.target.value })}
            />
          </div>
        </Section>

        <Divider />

        {/* ---------------------------------------------------- bill to */}
        <Section id="sec-billto" title="Bill to">
          <Card padded={false} className="py-1 pr-4 pl-4">
            <Toggle
              label="Billing via agency"
              description="The agency pays you for a brand's campaign"
              checked={inv.viaAgency}
              onChange={(c) => update({ viaAgency: c })}
            />
          </Card>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-soft" id="inv-billto-label">
              {inv.viaAgency ? "Agency" : "Brand"}
            </span>
            <button
              id="inv-billto"
              type="button"
              aria-labelledby="inv-billto-label inv-billto"
              aria-describedby={errors.billTo ? "inv-billto-error" : undefined}
              aria-haspopup="dialog"
              onClick={() => setPickerOpen(true)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-key border bg-white px-4 py-2.5 text-left transition-colors duration-150 hover:bg-tint",
                errors.billTo ? "border-warm" : "border-line",
              )}
            >
              <span className="min-w-0 flex-1">
                {party ? (
                  <>
                    <span className="block truncate text-[16px]">{party.name}</span>
                    <span className="block truncate text-sm text-soft">
                      {[party.type === "agency" ? "Agency" : "Brand", partyState, party.gstin].filter(Boolean).join(" · ")}
                    </span>
                  </>
                ) : (
                  <span className="text-[16px] text-faint">{inv.viaAgency ? "Choose an agency" : "Choose a brand"}</span>
                )}
              </span>
              <CaretRight size={16} aria-hidden="true" className="shrink-0 text-soft" />
            </button>
            {errors.billTo ? <InlineError id="inv-billto-error">{errors.billTo}</InlineError> : null}
          </div>
          {inv.viaAgency ? (
            <Input
              id="inv-endbrand"
              label="Campaign for"
              placeholder="Mamaearth"
              value={inv.endBrandName}
              error={errors.endBrandName}
              helper={'Printed as "Campaign for: Mamaearth"'}
              onChange={(e) => {
                update({ endBrandName: e.target.value });
                clearError("endBrandName");
              }}
            />
          ) : null}
          <Input
            label="Campaign name"
            optional
            placeholder="Onion Hair Oil Diwali launch"
            value={inv.campaignName}
            onChange={(e) => update({ campaignName: e.target.value })}
          />
        </Section>

        <Divider />

        {/* ---------------------------------------------------- items */}
        <Section id="sec-items" title="Line items">
          <div id="inv-items" tabIndex={-1} className="flex flex-col gap-3 outline-none">
            <LineItemsEditor
              items={inv.items}
              presets={presets}
              errors={errors.itemErrors ?? {}}
              onChange={(items) => {
                update({ items });
                setErrors((e) => ({ ...e, items: undefined, itemErrors: undefined }));
              }}
            />
            {errors.items ? <InlineError>{errors.items}</InlineError> : null}
          </div>
        </Section>

        <Divider />

        {/* ---------------------------------------------------- tax */}
        <Section id="sec-tax" title="Tax">
          {inv.gstMode !== "none" ? (
            <>
              <Card className="text-sm leading-relaxed">
                <p className="font-medium text-ink">Tax invoice</p>
                <p className="mt-0.5 text-soft">{gstExplain}</p>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="inv-gst"
                  label="GST rate"
                  suffix="%"
                  inputMode="decimal"
                  numeric
                  value={gstRateText}
                  error={errors.gstRate}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.]/g, "");
                    setGstRateText(v);
                    const n = parsePercent(v);
                    if (n !== null) update({ gstRate: n });
                    clearError("gstRate");
                  }}
                />
                <Input
                  label="SAC code"
                  optional
                  inputMode="numeric"
                  placeholder="998361"
                  maxLength={8}
                  value={inv.sacCode}
                  onChange={(e) => update({ sacCode: e.target.value.replace(/\D/g, "") })}
                />
              </div>
            </>
          ) : (
            <Card className="text-sm leading-relaxed">
              <p className="font-medium">No GST</p>
              <p className="mt-0.5 text-soft">
                You&apos;re not GST registered, so this is a plain invoice. Change it in Profile, Tax settings.
              </p>
            </Card>
          )}
          <Card padded={false} className="py-1 pr-4 pl-4">
            <Toggle
              label="Show expected TDS"
              description="Adds a reference line. Your total stays the same."
              checked={inv.showTds}
              onChange={(c) => {
                update({ showTds: c });
                clearError("tdsRate");
              }}
            />
          </Card>
          {inv.showTds ? (
            <Input
              id="inv-tds"
              label="Expected TDS rate"
              suffix="%"
              inputMode="decimal"
              numeric
              placeholder="10"
              value={tdsText}
              error={errors.tdsRate}
              helper="Confirm the rate with your CA"
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, "");
                setTdsText(v);
                update({ tdsRate: parsePercent(v) });
                clearError("tdsRate");
              }}
            />
          ) : null}
        </Section>

        <Divider />

        {/* ---------------------------------------------------- notes & options */}
        <Section id="sec-notes" title="Notes and options">
          <Textarea
            label="Notes and terms"
            optional
            rows={4}
            placeholder="Payment due within 15 days. Usage rights: 3 months from posting date, organic only."
            value={inv.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
          <Card padded={false} className="divide-y divide-line px-4">
            <div className="py-1">
              <Toggle
                label="Include bank details"
                description={hasBank ? undefined : "Add bank details in Profile first"}
                checked={inv.includeBank && hasBank}
                disabled={!hasBank}
                onChange={(c) => update({ includeBank: c })}
              />
            </div>
            <div className="py-1">
              <Toggle
                label="Include UPI QR"
                description={hasUpi ? (payment.upiId ? "QR for the exact total" : "Uses your uploaded QR image") : "Add a UPI ID in Profile first"}
                checked={inv.includeUpiQr && hasUpi}
                disabled={!hasUpi}
                onChange={(c) => update({ includeUpiQr: c })}
              />
            </div>
            <div className="py-1">
              <Toggle
                label="Include signature"
                description={profile.signature ? undefined : "Upload a signature in Profile first"}
                checked={inv.includeSignature && !!profile.signature}
                disabled={!profile.signature}
                onChange={(c) => update({ includeSignature: c })}
              />
            </div>
          </Card>
        </Section>

        <TotalsCard view={liveView} />

        {!existsInDb ? (
          <DestructiveButton
            fullWidth
            confirmTitle="Discard this invoice?"
            confirmDescription="Everything you've entered on this invoice will be cleared."
            confirmLabel="Discard invoice"
            onConfirm={async () => {
              await deleteKV(AUTOSAVE_KEY);
              dirty.current = false;
              nav.pop();
            }}
          >
            Discard
          </DestructiveButton>
        ) : null}
      </div>

      <BrandPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        parties={parties}
        selectedId={inv.billToId}
        preferType={inv.viaAgency ? "agency" : "brand"}
        onPick={pickParty}
      />
    </PushedScreen>
  );
}

