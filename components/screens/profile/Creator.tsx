"use client";

import { useNav } from "@/lib/nav";
import { useToast } from "@/components/ui";
import { CreatorForm } from "@/components/profile/forms";
import { PushedScreen } from "@/components/screens/Screen";

import { saveProfile } from "@/db";
import { useProfile } from "@/db/queries";

export function CreatorScreen() {
  const profile = useProfile();
  const nav = useNav();
  const toast = useToast();
  return (
    <PushedScreen title="Creator details">
      {profile ? (
        <CreatorForm
          initial={profile}
          submitLabel="Save"
          onSubmit={async (v) => {
            await saveProfile(v);
            toast.show("Details saved");
            nav.pop();
          }}
        />
      ) : (
        null
      )}
    </PushedScreen>
  );
}
