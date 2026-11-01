"use client";

import { useEffect, useState } from "react";
import { DestructiveButton, useToast } from "@/components/ui";
import { PartyForm } from "@/components/profile/PartyForm";
import { PushedScreen } from "@/components/screens/Screen";
import { db, deleteParty, newParty, saveParty } from "@/db";
import { useNav } from "@/lib/nav";
import type { Party } from "@/types";

export function BrandEditScreen({ id }: { id?: string }) {
  const nav = useNav();
  const toast = useToast();
  const [party, setParty] = useState<Party | null>(null);

  useEffect(() => {
    if (!id) {
      setParty(newParty());
      return;
    }
    void db.parties.get(id).then((p) => setParty(p && !p.deletedAt ? p : newParty()));
  }, [id]);

  const isNew = !id;
  return (
    <PushedScreen title={isNew ? "Add brand or agency" : "Edit brand"}>
      {party ? (
        <PartyForm
          key={party.id}
          initial={party}
          submitLabel={isNew ? "Add brand" : "Save"}
          onSubmit={async (p) => {
            await saveParty(p);
            toast.show(isNew ? `${p.name} added` : "Changes saved");
            nav.pop();
          }}
          secondary={
            isNew ? null : (
              <DestructiveButton
                size="lg"
                fullWidth
                confirmTitle={`Delete ${party.name}?`}
                confirmDescription="Invoices already sent keep their copy of these details. Drafts will need a new brand."
                confirmLabel="Delete brand"
                onConfirm={async () => {
                  await deleteParty(party.id);
                  toast.show("Brand deleted");
                  nav.pop();
                }}
              >
                Delete brand
              </DestructiveButton>
            )
          }
        />
      ) : null}
    </PushedScreen>
  );
}
