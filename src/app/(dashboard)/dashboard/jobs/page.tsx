import Link from "next/link";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import { deleteJob } from "@/features/jobs/actions";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { scoreMatch } from "@/lib/matching";

export default async function DashboardJobs() {
  const user = await requireUser();
  const entitlements = await getEntitlements(user);

  if (user.accountType === "corporate" && user.organizationId) {
    const jobs = await sql<
      { id: string; title: string; status: string; applicants: string }[]
    >`
      select j.id, j.title, j.status, count(a.id)::text as applicants
      from jobs j
      left join applications a on a.job_id = j.id
      where j.organization_id = ${user.organizationId}
      group by j.id
      order by j.created_at desc
    `;
    return (
      <div>
        <p className="eyebrow">Roles</p>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
            margin: "0.35rem 0 1rem",
          }}
        >
          Your job board
        </h1>
        {!hasCap(entitlements, "publish_jobs") && (
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Drafts are included. Publishing and the applicant pipeline need the
            Employer or Workforce plan.{" "}
            <Link href="/dashboard/membership">View membership</Link>
          </p>
        )}
        <Link className="btn btn-primary" href="/dashboard/jobs/new">
          New role
        </Link>
        <div className="table-wrap" style={{ marginTop: "1rem" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link href={`/dashboard/jobs/${job.id}`}>{job.title}</Link>
                  </td>
                  <td>
                    <span className={`badge badge-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.applicants}</td>
                  <td>
                    <SubmissionActions
                      recordId={job.id}
                      idField="jobId"
                      editHref={`/dashboard/jobs/${job.id}#role-editor`}
                      deleteAction={deleteJob}
                      itemLabel="role"
                      confirmMessage="Delete this role permanently? Its applications and applicant history will also be deleted. This action cannot be undone."
                    />
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4}>No roles yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const profile = await sql<
    {
      skills: string[];
      industries: string[];
      experienceYears: number | null;
      city: string | null;
      country: string | null;
      diaspora: boolean;
    }[]
  >`select skills, industries, experience_years, city, country, diaspora from professional_profiles where profile_id = ${user.id} limit 1`;
  const jobs = await sql<
    {
      id: string;
      title: string;
      summary: string;
      city: string | null;
      country: string | null;
      skills: string[];
      industries: string[];
      minExperience: number | null;
      diasporaPreferred: boolean;
      organization: string;
    }[]
  >`
    select j.id, j.title, j.summary, j.city, j.country, j.skills, j.industries, j.min_experience, j.diaspora_preferred, o.name as organization
    from jobs j
    join organizations o on o.id = j.organization_id
    where j.status = 'open'
    order by j.published_at desc nulls last
    limit 40
  `;
  const ranked = jobs
    .map((job) => ({
      job,
      match: profile[0]
        ? scoreMatch(profile[0], job)
        : { score: 0, reasons: [] as string[] },
    }))
    .sort((a, b) => b.match.score - a.match.score);

  return (
    <div>
      <p className="eyebrow">Matches</p>
      <h1
        style={{
          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
          margin: "0.35rem 0 0.6rem",
        }}
      >
        Roles scored against your profile
      </h1>
      <p className="muted">
        The score reads skills, industry, location and experience. It is not a
        hiring decision.
      </p>
      <div className="form-grid" style={{ marginTop: "1.2rem" }}>
        {ranked.map(({ job, match }) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="card"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <strong>{job.title}</strong>
              <span className="badge">{match.score}</span>
            </div>
            <p className="muted">{job.organization}</p>
            <div className="meter" aria-hidden>
              <span style={{ width: `${match.score}%` }} />
            </div>
            <p style={{ marginTop: "0.45rem" }}>
              {match.reasons[0] ?? job.summary}
            </p>
          </Link>
        ))}
        {ranked.length === 0 && (
          <div className="empty">No open roles to match.</div>
        )}
      </div>
    </div>
  );
}
