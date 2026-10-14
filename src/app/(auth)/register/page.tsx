import type { Metadata } from "next";
import Link from "next/link";
import { redirectIfSignedIn } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterChooser() {
  await redirectIfSignedIn();
  return (
    <div className="form-grid">
      <div>
        <p className="eyebrow">Membership</p>
        <h1 style={{ fontSize: "3rem", marginTop: "0.4rem" }}>How will you use Selecture?</h1>
      </div>
      <Link className="card" href="/register/corporate" style={{ textDecoration: "none" }}>
        <p className="eyebrow">Primary</p>
        <h2>I represent an organisation</h2>
        <p>Register the company and submit search, outsourcing or training requests.</p>
      </Link>
      <Link className="card" href="/register/professional" style={{ textDecoration: "none" }}>
        <p className="eyebrow">Individual</p>
        <h2>I am a professional</h2>
        <p>Create a private profile, store a CV and register for programmes.</p>
      </Link>
    </div>
  );
}
