import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AssessButton } from "@/components/assessment/AssessButton";
import { StageForm } from "@/components/jobs/ApplicationForms";
import { JobForm } from "@/components/jobs/JobForm";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import { deleteJob, inviteMatch } from "@/features/jobs/actions";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { APPLICATION_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { anonymousLabel, scoreMatch } from "@/lib/matching";

type Props = { params: Promise<{ id: string }> };

export default async function ManageJobPage({ params }: Props) {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard/jobs");
  const { id } = await params;
  const jobs = await sql<
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
      status: string;
    }[]
  >`
    select id, title, summary, description, city, country, employment_type, seniority, skills, industries,
      min_experience, headcount, salary_min, salary_max, diaspora_preferred, status
    from jobs
    where id = ${id} and organization_id = ${user.organizationId}
    limit 1
  `;
  const job = jobs[0];
  if (!job) notFound();
  const entitlements = await getEntitlements(user);
  const canTrack = hasCap(entitlements, "ats");
  const applications = await sql<
    {
      id: string;
      profileId: string;
      fullName: string;
      status: keyof typeof APPLICATION_LABELS;
      matchScore: number;
      coverNote: string | null;
      priority: boolean;
    }[]
  >`
    select a.id, a.profile_id, p.full_name, a.status, a.match_score, a.cover_note, a.priority
    from applications a
    join profiles p on p.id = a.profile_id
    where a.job_id = ${job.id}
    order by a.match_score desc, a.created_at desc
  `;

  const people = canTrack
    ? await sql<
        {
          profileId: string;
          skills: string[];
          industries: string[];
          experienceYears: number | null;
          city: string | null;
          country: string | null;
          diaspora: boolean;
        }[]
      >`
        select profile_id, skills, industries, experience_years, city, country, diaspora
        from professional_profiles
        where visibility = 'selecture_only'
      `
    : [];
  const applied = new Set(applications.map((row) => row.profileId));
  const suggestions = people
    .filter((person) => !applied.has(person.profileId))
    .map((person) => ({ person, match: scoreMatch(person, job) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 6);

  return (
    <div className="split-page">
      <div>
        <p className="eyebrow">Applicant tracking</p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            margin: "0.3rem 0 1rem",
          }}
        >
          {job.title}
        </h1>
        <SubmissionActions
          recordId={job.id}
          idField="jobId"
          editHref="#role-editor"
          deleteAction={deleteJob}
          itemLabel="role"
          confirmMessage="Delete this role permanently? Its applications and applicant history will also be deleted. This action cannot be undone."
        />
        {!canTrack && (
          <p className="muted" style={{ marginBottom: "1rem" }}>
            You can edit the draft. The pipeline and invitations open on the
            Employer plan.{" "}
            <Link href="/dashboard/membership">View membership</Link>
          </p>
        )}
        <div className="form-grid">
          {applications.map((application) => (
            <article
              key={application.id}
              className="card"
              style={{ display: "grid", gap: "0.55rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.8rem",
                  flexWrap: "wrap",
                }}
              >
                <strong>{application.fullName}</strong>
                <span className={`badge badge-${application.status}`}>
                  {APPLICATION_LABELS[application.status]}
                </span>
              </div>
              <p>
                Match {application.matchScore}
                {application.priority ? " · Priority" : ""}
              </p>
              {application.coverNote && (
                <p className="muted">{application.coverNote}</p>
              )}
              <p>
                <a href={`/api/cv?profile=${application.profileId}`}>
                  Download CV
                </a>
              </p>
              {canTrack && (
                <>
                  <StageForm
                    applicationId={application.id}
                    status={application.status}
                  />
                  <AssessButton
                    jobId={job.id}
                    profileId={application.profileId}
                  />
                </>
              )}
            </article>
          ))}
          {applications.length === 0 && (
            <div className="empty">No applications yet.</div>
          )}
        </div>
        {canTrack && (
          <div style={{ marginTop: "1.5rem" }}>
            <h2>Suggested matches</h2>
            <p className="muted">
              Names stay hidden until the person applies. An invitation asks
              them to look at the role.
            </p>
            <div className="form-grid" style={{ marginTop: "0.8rem" }}>
              {suggestions.map(({ person, match }) => (
                <article key={person.profileId} className="card">
                  <strong>{anonymousLabel(person.profileId)}</strong>
                  <p>Match {match.score}</p>
                  <p className="muted">
                    {match.reasons[0] ??
                      "Limited overlap on the written profile."}
                  </p>
                  <form action={inviteMatch} style={{ marginTop: "0.6rem" }}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input
                      type="hidden"
                      name="profileId"
                      value={person.profileId}
                    />
                    <button className="btn btn-line" type="submit">
                      Invite
                    </button>
                  </form>
                </article>
              ))}
              {suggestions.length === 0 && (
                <div className="empty">
                  No further matches in the visible pool.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <JobForm job={job} canPublish={hasCap(entitlements, "publish_jobs")} />
    </div>
  );
}
