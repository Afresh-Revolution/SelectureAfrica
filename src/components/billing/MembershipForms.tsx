"use client";

import { useActionState } from "react";
import { cancelMembership, grantMembership } from "@/features/billing/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CancelMembership() {
  const [state, action] = useActionState(cancelMembership, null);
  return (
    <form action={action} className="form-grid">
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Cancelling">Cancel renewal</SubmitButton>
    </form>
  );
}

export function GrantMembershipForm({ plans }: { plans: { code: string; name: string }[] }) {
  const [state, action] = useActionState(grantMembership, null);
  return (
    <form action={action} className="form-grid card">
      <h2>Grant a plan</h2>
      <p className="muted">Use this when a membership is paid outside Paystack, or while the gateway is being tested.</p>
      <label className="field">
        <span>Account email</span>
        <input name="email" type="email" required />
      </label>
      <label className="field">
        <span>Plan</span>
        <select name="planCode" required defaultValue={plans[0]?.code}>
          {plans.map((plan) => (
            <option key={plan.code} value={plan.code}>{plan.name}</option>
          ))}
        </select>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Granting">Grant membership</SubmitButton>
    </form>
  );
}
