import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "For employers" };

const points = [
  "Register the organisation and the people authorised to instruct us.",
  "Submit executive search, outsourcing, screening or training requests.",
  "Follow status updates written by the consultant on the mandate.",
  "Keep communication preferences under your control.",
];

export default function EmployersPage() {
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 860 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>For employers</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.8rem)", marginTop: "0.6rem" }}>
            Corporate membership is the front door.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            Selecture is instructed by organisations. Membership keeps the profile, the requests and the
            correspondence in one place. Retained search stays with a consultant. An employer plan can also
            publish roles and follow applicants.
          </p>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <Link className="btn btn-primary" href="/register/corporate">
              Register your organisation
            </Link>
            <Link className="btn btn-ghost" href="/jobs">
              Open roles
            </Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container grid-2">
          <div>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>What you can do</h2>
            <ul className="prose" style={{ marginTop: "1rem", paddingLeft: "1.1rem" }}>
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <article className="card">
            <h3>What stays with Selecture</h3>
            <p>
              Research, qualification, interviews and the decision to present a candidate remain consultant-led.
              Employers receive updates and next steps. A published role shows applicants who chose to apply.
              Suggested matches stay anonymous until that person applies.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Candidate documents stay in private storage. They are visible to the member who uploaded them, to Selecture staff, and to an employer only after that person applies.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
