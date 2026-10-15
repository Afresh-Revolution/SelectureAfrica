import Link from "next/link";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import { deleteApplication } from "@/features/jobs/actions";
import { StageForm } from "@/components/jobs/ApplicationForms";
import { requireUser } from "@/lib/auth";
import { APPLICATION_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function ApplicationsPage() {
  const user = await requireUser();
  const rows = await sql<
    {
      id: string;
      jobId: string;
      title: string;
      organization: string;
      status: keyof typeof APPLICATION_LABELS;
      matchScore: number;
      createdAt: string;
    }[]
  >`
    select a.id, j.id as job_id, j.title, o.name as organization, a.status, a.match_score, a.created_at
    from applications a
    join jobs j on j.id = a.job_id
    join organizations o on o.id = j.organization_id
    where a.profile_id = ${user.id}
    order by a.created_at desc
  `;
  return (
    <div>
      <p className="eyebrow">Applications</p>
      <h1
        style={{
          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
          margin: "0.35rem 0 1rem",
        }}
      >
        Where you have applied
      </h1>
      <div className="form-grid">
        {rows.map((row) => (
          <article
            key={row.id}
            className="card"
            style={{ display: "grid", gap: "0.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.8rem",
                flexWrap: "wrap",
              }}
            >
              <Link href={`/jobs/${row.jobId}`}>
                <strong>{row.title}</strong>
              </Link>
              <span className={`badge badge-${row.status}`}>
                {APPLICATION_LABELS[row.status]}
              </span>
            </div>
            <p className="muted">
              {row.organization} · Match {row.matchScore} ·{" "}
              {formatDate(row.createdAt)}
            </p>
            <SubmissionActions
              recordId={row.id}
              idField="applicationId"
              editHref={`/dashboard/applications/${row.id}/edit`}
              deleteAction={deleteApplication}
              itemLabel="application"
            />
            {row.status !== "withdrawn" &&
              row.status !== "hired" &&
              row.status !== "rejected" && (
                <StageForm
                  applicationId={row.id}
                  status={row.status}
                  allowWithdrawOnly
                />
              )}
          </article>
        ))}
        {rows.length === 0 && (
          <div className="empty">
            You have not applied yet.{" "}
            <Link href="/jobs">Browse open roles</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
