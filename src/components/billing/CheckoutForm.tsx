"use client";

import { useActionState } from "react";
import { startCheckout } from "@/features/billing/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CheckoutForm({ planCode, label }: { planCode: string; label: string }) {
  const [state, action] = useActionState(startCheckout, null);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="planCode" value={planCode} />
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Opening Paystack">{label}</SubmitButton>
    </form>
  );
}
