import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditApplicationForm } from "@/components/jobs/ApplicationForms";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.accountType !== "professional") redirect("/dashboard/applications");
  const { id } = await params;
  const rows = await sql<
    { id: string; jobId: string; title: string; coverNote: string | null }[]
  >`
    select a.id, a.job_id, j.title, a.cover_note
    from applications a
    join jobs j on j.id = a.job_id
    where a.id = ${id} and a.profile_id = ${user.id}
    limit 1
  `;
  const application = rows[0];
  if (!application) notFound();

  return (
    <div className="member-edit-page">
      <p className="eyebrow">Application</p>
      <h1>Edit application note</h1>
      <p className="muted">{application.title}</p>
      <EditApplicationForm
        applicationId={application.id}
        jobId={application.jobId}
        coverNote={application.coverNote}
      />
      <p className="member-edit-cancel">
        <Link href="/dashboard/applications">
          Cancel and return to applications
        </Link>
      </p>
    </div>
  );
}
