"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignInForm({ next, reset }: { next?: string; reset?: boolean }) {
  const [state, action] = useActionState(signIn, null);
  return (
    <form action={action} className="form-grid">
      <div>
        <p className="eyebrow">Sign in</p>
        <h1 style={{ fontSize: "3rem", margin: "0.4rem 0 0.6rem" }}>Welcome back.</h1>
      </div>
      {reset && <p className="alert alert-success">Password updated. Sign in with the new one.</p>}
      {next && <input type="hidden" name="next" value={next} />}
      <label className="honeypot" aria-hidden>
        Website
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Signing in">Sign in</SubmitButton>
      <p className="muted">
        <Link href="/forgot-password">Forgot password</Link>
        {" · "}
        <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
