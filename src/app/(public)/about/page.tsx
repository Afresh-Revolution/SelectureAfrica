import type { Metadata } from "next";
import Link from "next/link";
import { VALUES } from "@/lib/constants";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 860 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>About the firm</p>
          <h1 style={{ fontSize: "clamp(3rem, 6vw, 5rem)", color: "white", marginTop: "0.7rem" }}>
            First choice, by the quality of the work.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            Our mission is to be the first choice for clients seeking executive recruitment and for candidates
            seeking serious placement — recognised for innovation, expertise and service.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container grid-2">
          <div className="prose">
            <p>
              Selecture Africa began as a Lagos executive search and recruitment practice with a heritage in
              placing international professionals. The intercultural skill required of today’s leaders — people
              who work across markets, not only inside one office — is the centre of the advice.
            </p>
            <p>
              Over years in market, the firm has built a view of where talent actually sits: in African cities,
              and in the diaspora. Mandates are delivered by sourcing either, or both, against a client’s real
              requirement rather than a generic shortlist.
            </p>
            <p>
              The relationship is outcome-based. We share the discipline of getting to a result without wasting
              the client’s time, and we expect the same candour in return. Your success is the measure.
            </p>
          </div>
          <div className="prose">
            <h2>How a mandate is held</h2>
            <p>
              A senior consultant manages executive search from briefing to close. Research is dedicated, not
              borrowed from a general inbox. Senior advisers and subject-matter experts join where the role
              demands it.
            </p>
            <p>
              Outsourcing is held by an account manager and recruitment consultant, with the same research
              standard, and continues through background checks into payroll management.
            </p>
            <p>
              <Link href="/services">See the services and the two delivery processes</Link>
            </p>
          </div>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="eyebrow">Values</p>
          <h2 style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)", margin: "0.6rem 0 1.5rem" }}>What we will not rush</h2>
          <div className="grid-4">
            {VALUES.map((value) => (
              <article className="card" key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
