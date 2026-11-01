"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { Button, Input, SegmentedControl } from "@/components/ui";
import {
  gstinStateCode,
  normalise,
  phoneDigits,
  phoneFromDigits,
  required,
  validateEmail,
  validateGstin,
  validatePhoneDigits,
} from "@/lib/validators";
import { stateName } from "@/lib/states";
import type { Party, PartyType } from "@/types";
import { AddressFields, FormActions, validateAddress } from "./forms";

type Key = "name" | "gstin" | "email" | "phone" | "pin";

/** Add or edit a brand or agency. */
export function PartyForm({
  initial,
  onSubmit,
  submitLabel,
  secondary,
}: {
  initial: Party;
  onSubmit: (p: Party) => Promise<void> | void;
  submitLabel: string;
  secondary?: ReactNode;
}) {
  const [p, setP] = useState<Party>(initial);
  const [phone, setPhone] = useState(phoneDigits(initial.phone));
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [busy, setBusy] = useState(false);
  // New entries start name-only. Editing opens the details if any exist.
  const hasDetails = !!(
    initial.gstin ||
    initial.contactPerson ||
    initial.email ||
    initial.phone ||
    initial.address.line1 ||
    initial.address.city ||
    initial.address.pin ||
    initial.address.stateCode
  );
  const [more, setMore] = useState(hasDetails);

  const set = <K extends keyof Party>(k: K, v: Party[K]) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const gstState = gstinStateCode(p.gstin);
  const stateHelper =
    gstState && p.address.stateCode && gstState !== p.address.stateCode
      ? `GSTIN is registered in ${stateName(gstState)}. Check the state`
      : "Decides CGST + SGST or IGST";

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next = Object.fromEntries(
      Object.entries({
        name: required(p.name, "Add the company name"),
        gstin: validateGstin(p.gstin),
        email: validateEmail(p.email),
        phone: validatePhoneDigits(phone),
        ...validateAddress(p.address),
      }).filter(([, v]) => v),
    ) as Partial<Record<Key, string>>;
    setErrors(next);
    const first = (["name", "gstin", "pin", "email", "phone"] as Key[]).find(
      (k) => next[k],
    );
    if (first) {
      document.getElementById(`party-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        ...p,
        name: p.name.trim(),
        phone: phoneFromDigits(phone),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      <SegmentedControl<PartyType>
        label="Type"
        value={p.type}
        onChange={(t) => set("type", t)}
        segments={[
          { value: "brand", label: "Brand" },
          { value: "agency", label: "Agency" },
        ]}
      />
      <Input
        id="party-name"
        label="Company name"
        placeholder={
          p.type === "agency"
            ? "Pepper Talent Pvt Ltd"
            : "Mamaearth (Honasa Consumer Ltd)"
        }
        value={p.name}
        error={errors.name}
        onChange={(e) => set("name", e.target.value)}
      />
      {!more ? (
        <Button
          type="button"
          variant="tint"
          size="md"
          fullWidth
          icon={CaretDown}
          onClick={() => setMore(true)}
        >
          Add GSTIN, address and contact
        </Button>
      ) : null}
      {more ? (
        <>
          <Input
            id="party-gstin"
            label="GSTIN"
            optional
            placeholder="29AABCH1234K1Z2"
            autoCapitalize="characters"
            maxLength={15}
            value={p.gstin}
            error={errors.gstin}
            onChange={(e) => {
              const gstin = normalise.upper(e.target.value);
              const code = gstinStateCode(gstin);
              setP((prev) => ({
                ...prev,
                gstin,
                // Fill the state from the GSTIN when it's still empty.
                address:
                  code && !prev.address.stateCode
                    ? { ...prev.address, stateCode: code }
                    : prev.address,
              }));
              setErrors((er) => ({ ...er, gstin: undefined }));
            }}
          />
          <AddressFields
            idPrefix="party"
            value={p.address}
            errors={errors}
            stateHelper={stateHelper}
            onChange={(a) => {
              setP((prev) => ({ ...prev, address: a }));
              setErrors((er) => ({ ...er, pin: undefined }));
            }}
          />
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-[15px] font-semibold">Contact</legend>
            <Input
              id="party-contactPerson"
              label="Contact person"
              optional
              placeholder="Ananya Iyer"
              value={p.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
            />
            <Input
              id="party-email"
              label="Email"
              optional
              type="email"
              placeholder="collabs@brand.in"
              value={p.email}
              error={errors.email}
              onChange={(e) => set("email", e.target.value.trim())}
            />
            <Input
              id="party-phone"
              label="Phone"
              optional
              prefix="+91"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              maxLength={10}
              value={phone}
              error={errors.phone}
              onChange={(e) => {
                setPhone(normalise.digits(e.target.value));
                setErrors((er) => ({ ...er, phone: undefined }));
              }}
            />
          </fieldset>
        </>
      ) : null}
      <FormActions
        submitLabel={submitLabel}
        busy={busy}
        secondary={secondary}
      />
    </form>
  );
}
