import type { Metadata } from "next";
import Link from "next/link";
import { OUTSOURCE_STEPS, SEARCH_STEPS, SERVICES } from "@/lib/constants";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>Services</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.8rem)", maxWidth: "14ch", marginTop: "0.6rem" }}>
            Search, outsourcing and the checks around them.
          </h1>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ display: "grid", gap: "1rem" }}>
          {SERVICES.map((service) => (
            <article id={service.slug} key={service.slug} className="card" style={{ display: "grid", gap: "0.6rem" }}>
              <h2>{service.title}</h2>
              <p className="lede">{service.summary}</p>
              <p className="muted">{service.detail}</p>
            </article>
          ))}
          <article className="card">
            <h2>Training & workforce development</h2>
            <p className="lede">
              Alongside search, Selecture prepares professionals through a short catalogue of courses. Organisations
              can also request training support as a service.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              <Link href="/programs">Open the programme catalogue</Link>
            </p>
          </article>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid-2">
          <div>
            <p className="eyebrow">Executive search delivery</p>
            <ol className="prose" style={{ marginTop: "1rem", paddingLeft: "1.1rem" }}>
              {SEARCH_STEPS.map((step) => (
                <li key={step.n}>
                  <strong>{step.title}.</strong> <span className="muted">{step.phase}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow">Outsourcing delivery</p>
            <ol className="prose" style={{ marginTop: "1rem", paddingLeft: "1.1rem" }}>
              {OUTSOURCE_STEPS.map((step) => (
                <li key={step.n}>
                  <strong>{step.title}.</strong> <span className="muted">{step.phase}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="container" style={{ marginTop: "2rem" }}>
          <Link className="btn btn-primary" href="/register/corporate">
            Submit a service request
          </Link>
        </div>
      </section>
    </>
  );
}
