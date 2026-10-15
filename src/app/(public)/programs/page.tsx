import type { Metadata } from "next";
import Link from "next/link";
import { PhotoShape } from "@/components/home/PhotoShape";
import { publishedPrograms } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Programs & training" };

export default async function ProgramsPage() {
  const programs = await publishedPrograms();
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 860 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>Programs & training</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.6rem)", marginTop: "0.6rem" }}>
            Four courses. One preparation.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            The catalogue introduces market education, capital, supply chains and workforce readiness. Dates,
            trainers and delivery format are confirmed per cohort. Confirmed participants on a learning membership
            can take the lessons, sit the check, and receive a certificate.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ display: "grid", gap: "1rem" }}>
          {programs.map((program, index) => (
            <Link
              key={program.id}
              href={`/programs/${program.slug}`}
              className="card"
              style={{
                textDecoration: "none",
                display: "grid",
                gridTemplateColumns: program.imageUrl ? "9rem 1fr" : "4rem 1fr",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              {program.imageUrl ? (
                <PhotoShape shape="squircle" src={program.imageUrl} alt={program.imageAlt || program.title} />
              ) : (
                <span className="eyebrow">0{index + 1}</span>
              )}
              <span>
                <h2>{program.title}</h2>
                <p className="muted" style={{ marginTop: "0.45rem" }}>{program.summary}</p>
                <p style={{ marginTop: "0.7rem" }}>
                  {[program.duration, program.format, program.startsOn ? `From ${formatDate(program.startsOn)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </span>
            </Link>
          ))}
          {programs.length === 0 && <div className="empty">Programmes will appear here once they are published.</div>}
        </div>
      </section>
    </>
  );
}
