"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="form-grid">
      <div>
        <p className="eyebrow">Password</p>
        <h1 style={{ fontSize: "2.8rem" }}>Reset access.</h1>
        <p className="muted">If email delivery is configured, a link is sent. A copy is also kept in your notifications once you can sign in again.</p>
      </div>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Sending">Send reset link</SubmitButton>
      <Link href="/sign-in">Back to sign in</Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <form action={action} className="form-grid">
      <h1 style={{ fontSize: "2.8rem" }}>Choose a new password.</h1>
      <input type="hidden" name="token" value={token} />
      <label className="field">
        <span>New password</span>
        <input name="password" type="password" minLength={10} required autoComplete="new-password" />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Updating">Update password</SubmitButton>
    </form>
  );
}
