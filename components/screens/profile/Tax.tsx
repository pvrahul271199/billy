"use client";

import { useNav } from "@/lib/nav";
import { useToast } from "@/components/ui";
import { TaxForm } from "@/components/profile/forms";
import { PushedScreen } from "@/components/screens/Screen";

import { saveProfile } from "@/db";
import { useProfile } from "@/db/queries";

export function TaxScreen() {
  const profile = useProfile();
  const nav = useNav();
  const toast = useToast();
  return (
    <PushedScreen title="Tax settings">
      {profile ? (
        <TaxForm
          initial={profile}
          pan={profile.pan}
          submitLabel="Save"
          onSubmit={async (v) => {
            await saveProfile(v);
            toast.show("Tax settings saved");
            nav.pop();
          }}
        />
      ) : (
        null
      )}
    </PushedScreen>
  );
}
