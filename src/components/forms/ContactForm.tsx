"use client";

import { useActionState } from "react";
import { SITE } from "@/lib/constants";
import { submitFeedback } from "@/features/membership/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ContactForm() {
  const [state, action] = useActionState(submitFeedback, null);
  return (
    <form action={action} className="form-grid card">
      <label className="honeypot" aria-hidden>
        Website
        <input name="company_website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Name</span>
          <input name="fullName" required autoComplete="name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <label className="field">
        <span>Topic</span>
        <select name="topic" defaultValue="General enquiry">
          <option>General enquiry</option>
          <option>Executive search</option>
          <option>Outsourcing</option>
          <option>Training programme</option>
          <option>Feedback</option>
        </select>
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" required minLength={10} />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Sending">Send message</SubmitButton>
      <p className="muted">Or write directly to {SITE.email}.</p>
    </form>
  );
}
