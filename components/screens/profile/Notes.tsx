"use client";

import { useNav } from "@/lib/nav";
import { useToast } from "@/components/ui";
import { NotesForm } from "@/components/profile/forms";
import { PushedScreen } from "@/components/screens/Screen";

import { saveProfile } from "@/db";
import { useProfile } from "@/db/queries";

export function NotesScreen() {
  const profile = useProfile();
  const nav = useNav();
  const toast = useToast();
  return (
    <PushedScreen title="Default notes and terms">
      {profile ? (
        <NotesForm
          initial={profile.defaultNotes}
          onSubmit={async (defaultNotes) => {
            await saveProfile({ defaultNotes });
            toast.show("Default notes saved");
            nav.pop();
          }}
        />
      ) : (
        null
      )}
    </PushedScreen>
  );
}
