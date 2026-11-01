"use client";

import { useState } from "react";
import { useNav } from "@/lib/nav";
import { Button, Card, Input, useToast } from "@/components/ui";
import { PushedScreen } from "@/components/screens/Screen";

import { allInvoiceNumbers, saveProfile } from "@/db";
import { useProfile, useToday } from "@/db/queries";
import { nextInvoiceNumber, sanitizePrefix } from "@/lib/numbering";
import { useLiveQuery } from "dexie-react-hooks";
import type { Profile } from "@/types";

function PrefixForm({ profile }: { profile: Profile }) {
  const [prefix, setPrefix] = useState(profile.invoicePrefix);
  const [error, setError] = useState<string>();
  const nav = useNav();
  const toast = useToast();
  const today = useToday();
  const numbers = useLiveQuery(() => allInvoiceNumbers(), []) ?? [];
  const preview = nextInvoiceNumber(prefix || "BLY", today, numbers);

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!prefix) {
          setError("Add a prefix of 1 to 6 letters or numbers");
          return;
        }
        await saveProfile({ invoicePrefix: prefix });
        toast.show("Prefix saved");
        nav.pop();
      }}
    >
      <Input
        label="Prefix"
        placeholder="BLY"
        autoCapitalize="characters"
        maxLength={6}
        value={prefix}
        error={error}
        helper="Up to 6 letters, numbers or dashes"
        onChange={(e) => {
          setPrefix(sanitizePrefix(e.target.value));
          setError(undefined);
        }}
      />
      <Card>
        <p className="text-sm text-soft">Next invoice number</p>
        <p className="mt-1 text-[17px] font-medium tabular">{preview}</p>
        <p className="mt-2 text-sm text-soft">
          Numbers restart at 001 each financial year (April to March). Existing invoices keep their numbers.
        </p>
      </Card>
      <Button type="submit" size="lg" fullWidth>
        Save
      </Button>
    </form>
  );
}

export function PrefixScreen() {
  const profile = useProfile();
  return <PushedScreen title="Invoice number prefix">{profile ? <PrefixForm profile={profile} /> : null}</PushedScreen>;
}
