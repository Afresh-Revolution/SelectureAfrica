import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "For professionals" };

export default function ProfessionalsPage() {
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 860 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>For professionals</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.8rem)", marginTop: "0.6rem" }}>
            A profile for people we may need to know.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            Individual membership is for African professionals, diaspora talent and people preparing for a programme.
            It is a relationship with the firm, not an open marketplace.
          </p>
          <Link className="btn btn-primary" href="/register/professional" style={{ marginTop: "1.4rem" }}>
            Create a professional account
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="container grid-3">
          <article className="card">
            <h3>Profile</h3>
            <p>Headline, location, skills, industries and whether you are based in the diaspora.</p>
          </article>
          <article className="card">
            <h3>Private CV</h3>
            <p>Upload a PDF or Word file. It is stored privately and is not published on the website.</p>
          </article>
          <article className="card">
            <h3>Programmes</h3>
            <p>Register your interest in a course and follow the status of that submission.</p>
          </article>
        </div>
      </section>
    </>
  );
}
