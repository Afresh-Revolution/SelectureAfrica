import { notFound } from "next/navigation";
import { StageForm } from "@/components/jobs/ApplicationForms";
import { requireStaff } from "@/lib/auth";
import { APPLICATION_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function AdminJobPage({ params }: Props) {
  await requireStaff();
  const { id } = await params;
  const jobs = await sql<{ title: string; organization: string; status: string }[]>`
    select j.title, o.name as organization, j.status
    from jobs j join organizations o on o.id = j.organization_id
    where j.id = ${id} limit 1
  `;
  const job = jobs[0];
  if (!job) notFound();
  const applications = await sql<{ id: string; fullName: string; email: string; status: keyof typeof APPLICATION_LABELS; matchScore: number; profileId: string }[]>`
    select a.id, p.full_name, p.email, a.status, a.match_score, a.profile_id
    from applications a
    join profiles p on p.id = a.profile_id
    where a.job_id = ${id}
    order by a.match_score desc
  `;
  return (
    <div>
      <p className="eyebrow">{job.organization} · {job.status}</p>
      <h1 className="admin-title">{job.title}</h1>
      <div className="form-grid" style={{ marginTop: "1rem" }}>
        {applications.map((application) => (
          <article key={application.id} className="card" style={{ display: "grid", gap: "0.5rem" }}>
            <strong>{application.fullName}</strong>
            <p className="muted">{application.email} · Match {application.matchScore}</p>
            <p><span className={`badge badge-${application.status}`}>{APPLICATION_LABELS[application.status]}</span></p>
            <p><a href={`/api/cv?profile=${application.profileId}`}>CV</a></p>
            <StageForm applicationId={application.id} status={application.status} />
          </article>
        ))}
        {applications.length === 0 && <div className="empty">No applicants.</div>}
      </div>
    </div>
  );
}
