import Link from "next/link";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import { deleteProgramRegistration } from "@/features/membership/actions";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";

export default async function LearningHome() {
  const user = await requireUser();
  const entitlements = await getEntitlements(user);
  const rows = await sql<
    {
      id: string;
      slug: string;
      title: string;
      status: string;
      lessons: string;
      done: string;
    }[]
  >`
    select r.id, p.slug, p.title, r.status,
      (select count(*) from lessons l where l.program_id = p.id)::text as lessons,
      (select count(*) from lesson_progress lp join lessons l on l.id = lp.lesson_id where l.program_id = p.id and lp.profile_id = ${user.id})::text as done
    from program_registrations r
    join programs p on p.id = r.program_id
    where r.profile_id = ${user.id}
    order by r.created_at desc
  `;
  const certificates = await sql<{ code: string; programTitle: string }[]>`
    select code, program_title from certificates where profile_id = ${user.id} order by issued_at desc
  `;
  const open = hasCap(entitlements, "learn");
  return (
    <div>
      <p className="eyebrow">Learning</p>
      <h1
        style={{
          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
          margin: "0.35rem 0 0.6rem",
        }}
      >
        Lessons, checks and certificates
      </h1>
      {!open && (
        <p className="muted">
          Confirmed programmes show here. Lessons, video and certificates open
          on Select, Fellow, or the Workforce plan.{" "}
          <Link href="/dashboard/membership">View membership</Link>
        </p>
      )}
      <div className="form-grid" style={{ marginTop: "1rem" }}>
        {rows.map((row) => (
          <article key={row.slug} className="card">
            <h2>{row.title}</h2>
            <p className="muted">
              {row.status} · {row.done} of {row.lessons} lessons
            </p>
            <SubmissionActions
              recordId={row.id}
              idField="registrationId"
              editHref={`/dashboard/submissions/${row.id}/edit`}
              deleteAction={deleteProgramRegistration}
              itemLabel="programme registration"
            />
            {open && row.status === "confirmed" ? (
              <Link href={`/dashboard/learning/${row.slug}`}>
                Open classroom
              </Link>
            ) : (
              <p>
                {row.status === "confirmed"
                  ? "Upgrade to open the lessons."
                  : "Selecture still needs to confirm this registration."}
              </p>
            )}
          </article>
        ))}
        {rows.length === 0 && (
          <div className="empty">
            No programme registrations yet.{" "}
            <Link href="/programs">Browse the catalogue</Link>.
          </div>
        )}
      </div>
      {certificates.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Certificates</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            {certificates.map((certificate) => (
              <li key={certificate.code}>
                <Link href={`/certificates/${certificate.code}`}>
                  {certificate.programTitle}
                </Link>{" "}
                · {certificate.code}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
