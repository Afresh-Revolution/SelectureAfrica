import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "@/lib/db";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Open roles published by Selecture member organisations.",
};

export default async function JobsPage() {
  const jobs = await sql<
    { id: string; title: string; summary: string; city: string | null; country: string | null; employmentType: string; organization: string }[]
  >`
    select j.id, j.title, j.summary, j.city, j.country, j.employment_type, o.name as organization
    from jobs j
    join organizations o on o.id = j.organization_id
    where j.status = 'open'
    order by j.published_at desc nulls last, j.created_at desc
  `;
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 860 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>Job board</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.6rem)", marginTop: "0.6rem" }}>
            Roles organisations have chosen to publish.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            Retained search still sits with a consultant. These are the roles an employer plan has opened
            for applications. Your CV stays private until you apply.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container" style={{ display: "grid", gap: "1rem" }}>
          {jobs.length === 0 && <div className="empty">No open roles at the moment.</div>}
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="card" style={{ textDecoration: "none" }}>
              <p className="eyebrow">{job.organization}</p>
              <h2 style={{ marginTop: "0.4rem" }}>{job.title}</h2>
              <p className="muted" style={{ marginTop: "0.45rem" }}>{job.summary}</p>
              <p style={{ marginTop: "0.7rem" }}>
                {[job.city, job.country, job.employmentType].filter(Boolean).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
