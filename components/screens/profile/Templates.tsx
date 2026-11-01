"use client";

import { saveProfile } from "@/db";
import { useProfile } from "@/db/queries";
import { TemplatePicker } from "@/components/invoice/TemplatePicker";
import { PushedScreen } from "@/components/screens/Screen";
import { resolveTemplate } from "@/lib/invoice-templates";

export function TemplatesScreen() {
  const profile = useProfile();
  return (
    <PushedScreen title="Invoice template">
      {profile ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-soft">New invoices use this layout. You can change it on any invoice from its preview.</p>
          <TemplatePicker value={resolveTemplate(null, profile.invoiceTemplate)} onChange={(invoiceTemplate) => void saveProfile({ invoiceTemplate })} />
        </div>
      ) : null}
    </PushedScreen>
  );
}
