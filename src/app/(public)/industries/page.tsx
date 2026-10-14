import type { Metadata } from "next";
import { INDUSTRIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Industries" };

export default function IndustriesPage() {
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 820 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>Industries</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.8rem)", marginTop: "0.6rem" }}>
            Markets we already know how to hire in.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            Assignments run across Africa. The sector list is the one the firm has practised in, not a catalogue of everything.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container grid-2">
          {INDUSTRIES.map((industry, index) => (
            <article className="card" key={industry.title}>
              <p className="eyebrow">0{index + 1}</p>
              <h2 style={{ fontSize: "2rem", margin: "0.4rem 0" }}>{industry.title}</h2>
              <p>{industry.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
