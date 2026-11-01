"use client";

import { useNav } from "@/lib/nav";
import { useToast } from "@/components/ui";
import { BankForm } from "@/components/profile/forms";
import { PushedScreen } from "@/components/screens/Screen";

import { savePayment } from "@/db";
import { usePayment } from "@/db/queries";

export function BankScreen() {
  const payment = usePayment();
  const nav = useNav();
  const toast = useToast();
  return (
    <PushedScreen title="Bank and UPI">
      {payment ? (
        <BankForm
          initial={payment}
          submitLabel="Save"
          onSubmit={async (v) => {
            await savePayment(v);
            toast.show("Payment details saved");
            nav.pop();
          }}
        />
      ) : (
        null
      )}
    </PushedScreen>
  );
}
