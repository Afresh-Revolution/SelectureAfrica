"use client";

import Link from "next/link";
import { useActionState } from "react";
import { COMPANY_SIZES, COUNTRIES, INDUSTRY_OPTIONS } from "@/lib/constants";
import { registerCorporate, registerProfessional } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CorporateRegisterForm() {
  const [state, action] = useActionState(registerCorporate, null);
  return (
    <form action={action} className="form-grid">
      <div>
        <p className="eyebrow">Corporate membership</p>
        <h1 style={{ fontSize: "2.7rem", margin: "0.35rem 0" }}>Register the organisation.</h1>
        <p className="muted">The person completing this form becomes the account owner.</p>
      </div>
      <Honeypot />
      <div className="form-row">
        <Field name="fullName" label="Your name" autoComplete="name" />
        <Field name="email" label="Work email" type="email" autoComplete="email" />
      </div>
      <div className="form-row">
        <Field name="password" label="Password" type="password" autoComplete="new-password" />
        <Field name="phone" label="Phone" autoComplete="tel" required={false} />
      </div>
      <Field name="organizationName" label="Organisation" autoComplete="organization" />
      <div className="form-row">
        <Select name="industry" label="Industry" options={INDUSTRY_OPTIONS} />
        <Select name="sizeBand" label="Size" options={COMPANY_SIZES} />
      </div>
      <div className="form-row">
        <Select name="country" label="Country" options={COUNTRIES} />
        <Field name="city" label="City" required={false} />
      </div>
      <Field name="website" label="Website" required={false} />
      <label className="check">
        <input type="checkbox" name="newsletter" defaultChecked />
        <span>Send occasional briefings and service updates. You can opt out later.</span>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Creating account">Create corporate account</SubmitButton>
      <p className="muted">
        Already registered? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}

export function ProfessionalRegisterForm() {
  const [state, action] = useActionState(registerProfessional, null);
  return (
    <form action={action} className="form-grid">
      <div>
        <p className="eyebrow">Professional membership</p>
        <h1 style={{ fontSize: "2.7rem", margin: "0.35rem 0" }}>Join as an individual.</h1>
      </div>
      <Honeypot />
      <div className="form-row">
        <Field name="fullName" label="Full name" autoComplete="name" />
        <Field name="email" label="Email" type="email" autoComplete="email" />
      </div>
      <div className="form-row">
        <Field name="password" label="Password" type="password" autoComplete="new-password" />
        <Field name="phone" label="Phone" required={false} />
      </div>
      <Field name="headline" label="Professional headline" required={false} />
      <div className="form-row">
        <Select name="country" label="Country" options={COUNTRIES} />
        <Field name="city" label="City" required={false} />
      </div>
      <Field name="skills" label="Skills, separated by commas" required={false} />
      <label className="check">
        <input type="checkbox" name="diaspora" />
        <span>I am based outside my home market, in the diaspora.</span>
      </label>
      <label className="check">
        <input type="checkbox" name="newsletter" defaultChecked />
        <span>Send programme news and occasional briefings.</span>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Creating account">Create professional account</SubmitButton>
      <p className="muted">
        Representing a company? <Link href="/register/corporate">Register the organisation</Link>
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} required={required} autoComplete={autoComplete} />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue="">
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Honeypot() {
  return (
    <label className="honeypot" aria-hidden>
      Website
      <input name="company_website" tabIndex={-1} autoComplete="off" />
    </label>
  );
}
