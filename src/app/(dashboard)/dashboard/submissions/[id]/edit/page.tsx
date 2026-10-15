import Link from "next/link";
import { notFound } from "next/navigation";
import { EditProgramRegistrationForm } from "@/components/forms/ProgramRegister";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function EditSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const rows = await sql<
    { id: string; title: string; motivation: string | null }[]
  >`
    select r.id, p.title, r.motivation
    from program_registrations r
    join programs p on p.id = r.program_id
    where r.id = ${id} and r.profile_id = ${user.id}
    limit 1
  `;
  const registration = rows[0];
  if (!registration) notFound();

  return (
    <div className="member-edit-page">
      <p className="eyebrow">Programme registration</p>
      <h1>Edit registration</h1>
      <p className="muted">{registration.title}</p>
      <EditProgramRegistrationForm
        registrationId={registration.id}
        motivation={registration.motivation}
      />
      <p className="member-edit-cancel">
        <Link href="/dashboard/submissions">
          Cancel and return to submissions
        </Link>
      </p>
    </div>
  );
}
