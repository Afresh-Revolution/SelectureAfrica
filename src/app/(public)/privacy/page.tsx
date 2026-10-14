import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container-narrow prose">
        <p className="eyebrow">Privacy</p>
        <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)" }}>How member information is handled</h1>
        <p>
          Selecture Africa Ltd collects account details, organisation information, professional profiles, service
          requests, programme registrations and messages so that the firm can provide recruitment, outsourcing and
          training services.
        </p>
        <p>
          CVs and similar documents are stored privately. They are available to the member who uploaded them and to
          authorised Selecture staff. They are not placed on public pages or in a public media library.
        </p>
        <p>
          Newsletter and update preferences can be changed in your account, or by using the unsubscribe state on a
          briefing-list signup. You may ask {SITE.email} for access to, or deletion of, personal information the firm holds,
          subject to records we must keep for a live mandate or a legal duty.
        </p>
        <p>
          Accounts are protected with a hashed password and an httpOnly session. Staff actions that change a request,
          a registration, a programme or a member’s standing are written to an audit log.
        </p>
        <p>Offices: Lagos and London, as published on the contact page.</p>
      </div>
    </section>
  );
}
