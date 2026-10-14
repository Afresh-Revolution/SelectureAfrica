import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { REGISTRATION_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { RegistrationStatus } from "@/types";

export default async function SubmissionsPage() {
  const user = await requireUser();
  const rows = await sql<{ id: string; title: string; slug: string; status: RegistrationStatus; createdAt: string }[]>`
    select r.id, p.title, p.slug, r.status, r.created_at
    from program_registrations r
    join programs p on p.id = r.program_id
    where r.profile_id = ${user.id}
    order by r.created_at desc
  `;
  return (
    <div>
      <p className="eyebrow">Submissions</p>
      <h1 style={{ fontSize: "2.6rem", marginBottom: "1rem" }}>Programme registrations</h1>
      {rows.length === 0 ? (
        <div className="empty">
          Nothing registered yet. <Link href="/programs">Browse the catalogue</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Programme</th><th>Status</th><th>Registered</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><Link href={`/programs/${row.slug}`}>{row.title}</Link></td>
                  <td><span className={`badge badge-${row.status}`}>{REGISTRATION_LABELS[row.status]}</span></td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
