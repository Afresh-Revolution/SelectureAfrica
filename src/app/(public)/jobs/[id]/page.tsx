import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/jobs/ApplicationForms";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { scoreMatch } from "@/lib/matching";
import { isUuid } from "@/lib/validators";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Role" };
  const rows = await sql<{ title: string; summary: string }[]>`
    select title, summary from jobs where id = ${id} and status = 'open' limit 1
  `;
  return { title: rows[0]?.title ?? "Role", description: rows[0]?.summary };
}

function naira(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const rows = await sql<
    {
      id: string;
      title: string;
      summary: string;
      description: string;
      city: string | null;
      country: string | null;
      employmentType: string;
      seniority: string | null;
      skills: string[];
      industries: string[];
      minExperience: number | null;
      headcount: number;
      salaryMin: number | null;
      salaryMax: number | null;
      diasporaPreferred: boolean;
      organization: string;
    }[]
  >`
    select j.id, j.title, j.summary, j.description, j.city, j.country, j.employment_type, j.seniority,
      j.skills, j.industries, j.min_experience, j.headcount, j.salary_min, j.salary_max, j.diaspora_preferred,
      o.name as organization
    from jobs j
    join organizations o on o.id = j.organization_id
    where j.id = ${id} and j.status = 'open'
    limit 1
  `;
  const job = rows[0];
  if (!job) notFound();
  const user = await getCurrentUser();
  const profile = user?.accountType === "professional"
    ? (await sql<{ skills: string[]; industries: string[]; experienceYears: number | null; city: string | null; country: string | null; diaspora: boolean }[]>`
        select skills, industries, experience_years, city, country, diaspora
        from professional_profiles where profile_id = ${user.id} limit 1
      `)[0]
    : null;
  const match = profile ? scoreMatch(profile, job) : null;
  const salary = [naira(job.salaryMin), naira(job.salaryMax)].filter(Boolean).join(" – ");

  return (
    <article className="section">
      <div className="container split-page">
        <div>
          <p className="eyebrow">{job.organization}</p>
          <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)", margin: "0.5rem 0 1rem" }}>{job.title}</h1>
          <p className="lede">{job.summary}</p>
          <div className="prose" style={{ marginTop: "1.5rem" }}>
            {job.description.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          {job.skills.length > 0 && <p style={{ marginTop: "1rem" }}>Skills: {job.skills.join(", ")}</p>}
        </div>
        <aside className="card" style={{ display: "grid", gap: "0.7rem" }}>
          <p><strong>Where.</strong> {[job.city, job.country].filter(Boolean).join(", ") || "To be confirmed"}</p>
          <p><strong>Type.</strong> {job.employmentType}{job.seniority ? ` · ${job.seniority}` : ""}</p>
          <p><strong>Experience.</strong> {job.minExperience != null ? `${job.minExperience}+ years` : "Not specified"}</p>
          <p><strong>Headcount.</strong> {job.headcount}</p>
          {salary && <p><strong>Salary.</strong> {salary}</p>}
          {match && (
            <div>
              <p><strong>Your match.</strong> {match.score}</p>
              <div className="meter" aria-hidden><span style={{ width: `${match.score}%` }} /></div>
              <ul className="prose" style={{ paddingLeft: "1.1rem", marginTop: "0.6rem" }}>
                {match.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          {!user && <Link className="btn btn-primary" href={`/sign-in?next=/jobs/${job.id}`}>Sign in to apply</Link>}
          {user?.accountType === "professional" && <ApplyForm jobId={job.id} />}
          {user && user.accountType !== "professional" && user.accountType !== "admin" && user.accountType !== "super_admin" && (
            <p className="muted">Applications are made from a professional account.</p>
          )}
        </aside>
      </div>
    </article>
  );
}
