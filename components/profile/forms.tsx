"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Info } from "@phosphor-icons/react";
import { Button, Card, ImageUploader, Input, Select, Textarea, Toggle } from "@/components/ui";
import { STATE_OPTIONS } from "@/lib/states";
import {
  gstinStateCode,
  normalise,
  phoneDigits,
  phoneFromDigits,
  required,
  validateAccountNumber,
  validateEmail,
  validateGstin,
  validateIfsc,
  validateInstagram,
  validatePan,
  validatePhoneDigits,
  validatePin,
  validateSac,
  validateUpi,
} from "@/lib/validators";
import { parsePercent } from "@/lib/money";
import type { Address, PaymentDetails, Profile } from "@/types";

type Errors<K extends string> = Partial<Record<K, string>>;

/** Focus the first field with an error so keyboard and screen-reader users land on it. */
function focusFirstError(prefix: string, errors: Record<string, string | undefined>, order: string[]) {
  const first = order.find((k) => errors[k]);
  if (first) document.getElementById(`${prefix}-${first}`)?.focus();
}

function hasErrors(errors: Record<string, string | null | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

function clean<T extends Record<string, string | null | undefined>>(e: T): Errors<Extract<keyof T, string>> {
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors<Extract<keyof T, string>>;
}

export interface FormActionsProps {
  submitLabel: string;
  busy?: boolean;
  secondary?: ReactNode;
}

/** Bottom of a settings form: primary submit plus an optional secondary action. */
export function FormActions({ submitLabel, busy, secondary }: FormActionsProps) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      <Button type="submit" size="lg" fullWidth loading={busy}>
        {submitLabel}
      </Button>
      {secondary}
    </div>
  );
}

// ------------------------------------------------------------------ address

type AddressKey = "line1" | "line2" | "city" | "stateCode" | "pin";

export function validateAddress(a: Address): Errors<AddressKey> {
  return clean({ pin: validatePin(a.pin) });
}

export function AddressFields({
  idPrefix,
  value,
  onChange,
  errors,
  stateHelper,
}: {
  idPrefix: string;
  value: Address;
  onChange: (a: Address) => void;
  errors: Errors<AddressKey>;
  stateHelper?: string;
}) {
  const set = (k: AddressKey, v: string) => onChange({ ...value, [k]: v });
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 text-[15px] font-semibold">Address</legend>
      <Input
        id={`${idPrefix}-line1`}
        label="Address line 1"
        placeholder="Flat 402, Sea Breeze Apartments"
        autoComplete="address-line1"
        value={value.line1}
        onChange={(e) => set("line1", e.target.value)}
      />
      <Input
        id={`${idPrefix}-line2`}
        label="Address line 2"
        optional
        placeholder="Carter Road, Bandra West"
        autoComplete="address-line2"
        value={value.line2}
        onChange={(e) => set("line2", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id={`${idPrefix}-city`}
          label="City"
          placeholder="Mumbai"
          autoComplete="address-level2"
          value={value.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <Input
          id={`${idPrefix}-pin`}
          label="PIN code"
          placeholder="400050"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={value.pin}
          error={errors.pin}
          onChange={(e) => set("pin", normalise.digits(e.target.value))}
        />
      </div>
      <Select
        id={`${idPrefix}-stateCode`}
        label="State"
        placeholder="Choose a state"
        options={STATE_OPTIONS}
        value={value.stateCode}
        helper={stateHelper}
        onChange={(e) => set("stateCode", e.target.value)}
      />
    </fieldset>
  );
}

// ------------------------------------------------------------------ creator

export type CreatorValues = Pick<Profile, "fullName" | "instagram" | "email" | "phone" | "pan" | "address">;
type CreatorKey = "fullName" | "instagram" | "email" | "phone" | "pan" | AddressKey;
const CREATOR_ORDER: CreatorKey[] = ["fullName", "instagram", "email", "phone", "pan", "line1", "pin"];

export function CreatorForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
  children,
}: {
  initial: CreatorValues;
  onSubmit: (v: CreatorValues) => Promise<void> | void;
  submitLabel: string;
  secondary?: ReactNode;
  /** Extra content rendered before the actions (e.g. image uploads in onboarding). */
  children?: ReactNode;
}) {
  // Keep only this form's fields so saving can never overwrite other settings with stale values.
  const [v, setV] = useState<CreatorValues>(() => ({
    fullName: initial.fullName,
    instagram: initial.instagram,
    email: initial.email,
    phone: initial.phone,
    pan: initial.pan,
    address: { ...initial.address },
  }));
  const [phone, setPhone] = useState(phoneDigits(initial.phone));
  const [errors, setErrors] = useState<Errors<CreatorKey>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof CreatorValues>(k: K, val: CreatorValues[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next = clean({
      fullName: required(v.fullName, "Add your full name"),
      instagram: validateInstagram(v.instagram),
      email: validateEmail(v.email),
      phone: validatePhoneDigits(phone),
      pan: validatePan(v.pan),
      ...validateAddress(v.address),
    });
    setErrors(next);
    if (hasErrors(next)) return focusFirstError("creator", next, CREATOR_ORDER);
    setBusy(true);
    try {
      await onSubmit({ ...v, fullName: v.fullName.trim(), phone: phoneFromDigits(phone) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <Input
        id="creator-fullName"
        label="Full name"
        placeholder="Riya Sharma"
        autoComplete="name"
        value={v.fullName}
        error={errors.fullName}
        helper="As it should appear on invoices"
        onChange={(e) => set("fullName", e.target.value)}
      />
      <Input
        id="creator-instagram"
        label="Instagram username"
        prefix="@"
        placeholder="riya.creates"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={v.instagram}
        error={errors.instagram}
        onChange={(e) => set("instagram", normalise.instagram(e.target.value))}
      />
      <Input
        id="creator-email"
        label="Email"
        type="email"
        placeholder="riya@studio.in"
        autoComplete="email"
        value={v.email}
        error={errors.email}
        onChange={(e) => set("email", e.target.value.trim())}
      />
      <Input
        id="creator-phone"
        label="Phone"
        prefix="+91"
        type="tel"
        inputMode="numeric"
        placeholder="9876543210"
        autoComplete="tel-national"
        maxLength={10}
        value={phone}
        error={errors.phone}
        onChange={(e) => {
          setPhone(normalise.digits(e.target.value));
          setErrors((er) => ({ ...er, phone: undefined }));
        }}
      />
      <Input
        id="creator-pan"
        label="PAN"
        placeholder="ABCDE1234F"
        autoCapitalize="characters"
        maxLength={10}
        value={v.pan}
        error={errors.pan}
        onChange={(e) => set("pan", normalise.upper(e.target.value))}
      />
      <AddressFields
        idPrefix="creator"
        value={v.address}
        errors={errors}
        onChange={(a) => {
          setV((prev) => ({ ...prev, address: a }));
          setErrors((er) => ({ ...er, pin: undefined }));
        }}
      />
      {children}
      <FormActions submitLabel={submitLabel} busy={busy} secondary={secondary} />
    </form>
  );
}

// ------------------------------------------------------------------ images

export type ImageValues = Pick<Profile, "photo" | "logo" | "signature">;

export function ImageFields({ value, onChange }: { value: ImageValues; onChange: (v: ImageValues) => void }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-3 text-[15px] font-semibold">Images</legend>
      <ImageUploader label="Profile photo" kind="photo" value={value.photo} onChange={(photo) => onChange({ ...value, photo })} />
      <ImageUploader
        label="Logo"
        kind="logo"
        value={value.logo}
        onChange={(logo) => onChange({ ...value, logo })}
        helper="Shown at the top of your invoices"
      />
      <ImageUploader
        label="Signature"
        kind="signature"
        value={value.signature}
        onChange={(signature) => onChange({ ...value, signature })}
        helper="Sign on plain white paper and take a photo. The background is removed."
      />
    </fieldset>
  );
}

// ------------------------------------------------------------------ tax

export type TaxValues = Pick<Profile, "gstRegistered" | "gstin" | "defaultSac" | "defaultTdsRate">;
type TaxKey = "gstin" | "defaultSac" | "defaultTdsRate";

export function TaxForm({
  initial,
  pan,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: TaxValues;
  /** Used to check GSTIN characters 3–12. */
  pan: string;
  onSubmit: (v: TaxValues) => Promise<void> | void;
  submitLabel: string;
  secondary?: ReactNode;
}) {
  const [v, setV] = useState<TaxValues>(() => ({
    gstRegistered: initial.gstRegistered,
    gstin: initial.gstin,
    defaultSac: initial.defaultSac,
    defaultTdsRate: initial.defaultTdsRate,
  }));
  const [tds, setTds] = useState(initial.defaultTdsRate === null ? "" : String(initial.defaultTdsRate));
  const [errors, setErrors] = useState<Errors<TaxKey>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof TaxValues>(k: K, val: TaxValues[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const tdsRate = parsePercent(tds);
    const next = clean({
      gstin: v.gstRegistered ? (required(v.gstin, "Add your GSTIN, or turn off GST registration") ?? validateGstin(v.gstin, pan)) : null,
      defaultSac: v.gstRegistered ? validateSac(v.defaultSac) : null,
      defaultTdsRate: tds.trim() && tdsRate === null ? "Enter a percentage between 0 and 100" : null,
    });
    setErrors(next);
    if (hasErrors(next)) return focusFirstError("tax", next, ["gstin", "defaultSac", "defaultTdsRate"]);
    setBusy(true);
    try {
      await onSubmit({ ...v, defaultTdsRate: tdsRate });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <Card className="py-1">
        <Toggle
          label="I am GST registered"
          description="Adds GST to your invoices and titles them Tax Invoice"
          checked={v.gstRegistered}
          onChange={(c) => set("gstRegistered", c)}
        />
      </Card>
      {v.gstRegistered ? (
        <>
          <Input
            id="tax-gstin"
            label="GSTIN"
            placeholder="27ABCDE1234F1Z5"
            autoCapitalize="characters"
            maxLength={15}
            value={v.gstin}
            error={errors.gstin}
            helper={
              pan
                ? "Characters 3 to 12 must match your PAN"
                : "15 characters, from your GST certificate"
            }
            onChange={(e) => set("gstin", normalise.upper(e.target.value))}
          />
          <Input
            id="tax-defaultSac"
            label="Default SAC code"
            optional
            placeholder="998361"
            inputMode="numeric"
            maxLength={8}
            value={v.defaultSac}
            error={errors.defaultSac}
            helper="Service code printed on tax invoices. Confirm yours with your CA."
            onChange={(e) => set("defaultSac", normalise.digits(e.target.value))}
          />
        </>
      ) : null}
      <Input
        id="tax-defaultTdsRate"
        label="Default TDS rate"
        optional
        suffix="%"
        inputMode="decimal"
        placeholder="10"
        value={tds}
        error={errors.defaultTdsRate}
        onChange={(e) => {
          setTds(e.target.value.replace(/[^\d.]/g, ""));
          setErrors((er) => ({ ...er, defaultTdsRate: undefined }));
        }}
      />
      <Card className="flex gap-3 text-[13px] leading-relaxed text-soft">
        <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-ink" />
        <p>
          Brands may deduct TDS before paying you. Billy shows it as a note on the invoice and never reduces your total.
          Confirm the right rate with your CA.
        </p>
      </Card>
      <FormActions submitLabel={submitLabel} busy={busy} secondary={secondary} />
    </form>
  );
}

// ------------------------------------------------------------------ bank

export type BankValues = Omit<PaymentDetails, "id" | "updatedAt">;
type BankKey = "accountHolder" | "accountNumber" | "confirmAccount" | "ifsc" | "upiId";

export function BankForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: BankValues;
  onSubmit: (v: BankValues) => Promise<void> | void;
  submitLabel: string;
  secondary?: ReactNode;
}) {
  const [v, setV] = useState<BankValues>(() => ({
    accountHolder: initial.accountHolder,
    accountNumber: initial.accountNumber,
    ifsc: initial.ifsc,
    bankName: initial.bankName,
    branch: initial.branch,
    upiId: initial.upiId,
    staticQr: initial.staticQr,
  }));
  const [confirm, setConfirm] = useState(initial.accountNumber);
  const [errors, setErrors] = useState<Errors<BankKey>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof BankValues>(k: K, val: BankValues[K]) => {
    setV((prev) => ({ ...prev, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next = clean({
      accountNumber: validateAccountNumber(v.accountNumber),
      confirmAccount: v.accountNumber && confirm !== v.accountNumber ? "Account numbers don't match. Re-enter to confirm" : null,
      ifsc: validateIfsc(v.ifsc) ?? (v.accountNumber && !v.ifsc ? "Add the IFSC for this account" : null),
      upiId: validateUpi(v.upiId),
    });
    setErrors(next);
    if (hasErrors(next)) return focusFirstError("bank", next, ["accountHolder", "accountNumber", "confirmAccount", "ifsc", "upiId"]);
    setBusy(true);
    try {
      await onSubmit(v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-[15px] font-semibold">Bank account</legend>
        <Input
          id="bank-accountHolder"
          label="Account holder name"
          placeholder="Riya Sharma"
          autoComplete="name"
          value={v.accountHolder}
          onChange={(e) => set("accountHolder", e.target.value)}
        />
        <Input
          id="bank-accountNumber"
          label="Account number"
          inputMode="numeric"
          placeholder="50100123456789"
          autoComplete="off"
          maxLength={18}
          value={v.accountNumber}
          error={errors.accountNumber}
          onChange={(e) => set("accountNumber", normalise.digits(e.target.value))}
        />
        <Input
          id="bank-confirmAccount"
          label="Confirm account number"
          inputMode="numeric"
          placeholder="50100123456789"
          autoComplete="off"
          maxLength={18}
          value={confirm}
          error={errors.confirmAccount}
          helper="Type it again to avoid mistakes"
          onChange={(e) => {
            setConfirm(normalise.digits(e.target.value));
            setErrors((er) => ({ ...er, confirmAccount: undefined }));
          }}
        />
        <Input
          id="bank-ifsc"
          label="IFSC"
          placeholder="HDFC0001234"
          autoCapitalize="characters"
          maxLength={11}
          value={v.ifsc}
          error={errors.ifsc}
          onChange={(e) => set("ifsc", normalise.upper(e.target.value))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input id="bank-bankName" label="Bank name" placeholder="HDFC Bank" value={v.bankName} onChange={(e) => set("bankName", e.target.value)} />
          <Input id="bank-branch" label="Branch" placeholder="Bandra West" value={v.branch} onChange={(e) => set("branch", e.target.value)} />
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-[15px] font-semibold">UPI</legend>
        <Input
          id="bank-upiId"
          label="UPI ID"
          placeholder="riya@okhdfcbank"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={v.upiId}
          error={errors.upiId}
          helper="Invoices get a QR code for the exact amount"
          onChange={(e) => set("upiId", e.target.value.trim())}
        />
        <ImageUploader
          label="Static QR image"
          kind="qr"
          value={v.staticQr}
          onChange={(staticQr) => set("staticQr", staticQr)}
          helper="Optional. Used only when there is no UPI ID."
        />
      </fieldset>
      <FormActions submitLabel={submitLabel} busy={busy} secondary={secondary} />
    </form>
  );
}

/** Suggest the state from a GSTIN's first two digits. */
export function stateFromGstin(gstin: string): string {
  return gstinStateCode(gstin);
}

// ------------------------------------------------------------------ notes

export function NotesForm({
  initial,
  onSubmit,
}: {
  initial: string;
  onSubmit: (notes: string) => Promise<void> | void;
}) {
  const [notes, setNotes] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(notes.trim());
        } finally {
          setBusy(false);
        }
      }}
    >
      <Textarea
        label="Default notes and terms"
        rows={7}
        placeholder={"Payment due within 15 days of invoice date.\nUsage rights: 3 months from posting date, organic only."}
        helper="Pre-filled on every new invoice. You can still edit it per invoice."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <FormActions submitLabel="Save" busy={busy} />
    </form>
  );
}
