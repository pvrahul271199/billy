"use client";

import { ImageFields } from "@/components/profile/forms";
import { PushedScreen } from "@/components/screens/Screen";

import { useToast } from "@/components/ui";
import { saveProfile } from "@/db";
import { useProfile } from "@/db/queries";

export function ImagesScreen() {
  const profile = useProfile();
  const toast = useToast();
  return (
    <PushedScreen title="Images">
      {profile ? (
        <>
          <p className="mb-5 text-[15px] text-soft">Changes save as soon as you pick or remove an image.</p>
          <ImageFields
            value={{ photo: profile.photo, logo: profile.logo, signature: profile.signature }}
            onChange={async (v) => {
              await saveProfile(v);
              toast.show("Images saved");
            }}
          />
        </>
      ) : (
        null
      )}
    </PushedScreen>
  );
}
