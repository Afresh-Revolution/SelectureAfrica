import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container split-page">
        <div>
          <p className="eyebrow">Contact & feedback</p>
          <h1 style={{ fontSize: "clamp(2.8rem, 5vw, 4.2rem)", margin: "0.5rem 0 1rem" }}>Write to the firm.</h1>
          <div className="prose">
            <p>
              <strong className="with-flag"><CountryFlag country="ng" />{SITE.lagos.company}</strong><br />
              {SITE.lagos.lines.join(", ")}<br />
              <a href={SITE.lagos.phoneHref}>{SITE.lagos.phone}</a>
            </p>
            <p>
              <strong className="with-flag"><CountryFlag country="gb" />London</strong><br />
              {SITE.london.lines.join(", ")}<br />
              <a href={SITE.london.phoneHref}>{SITE.london.phone}</a>
            </p>
            <p>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
