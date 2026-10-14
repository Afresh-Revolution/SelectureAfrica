import { updateRegistration } from "@/features/admin/actions";
import { REGISTRATION_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { RegistrationStatus } from "@/types";

export default async function RegistrationsPage() {
  const rows = await sql<
    { id: string; title: string; fullName: string; email: string; status: RegistrationStatus; motivation: string | null; createdAt: string }[]
  >`
    select r.id, p.title, u.full_name, u.email, r.status, r.motivation, r.created_at
    from program_registrations r
    join programs p on p.id = r.program_id
    join profiles u on u.id = r.profile_id
    order by r.created_at desc
  `;
  return (
    <div>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Registrations</h1>
      <div className="form-grid">
        {rows.map((row) => (
          <article key={row.id} className="card">
            <strong>{row.fullName}</strong> · {row.email}
            <h2 style={{ fontSize: "1.6rem" }}>{row.title}</h2>
            <p className="muted">{row.motivation || "No note supplied."}</p>
            <p>{formatDate(row.createdAt)}</p>
            <form action={updateRegistration.bind(null, row.id)} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <select name="status" defaultValue={row.status}>
                {Object.entries(REGISTRATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button className="btn btn-navy" type="submit">Update</button>
            </form>
          </article>
        ))}
        {rows.length === 0 && <div className="empty">No registrations yet.</div>}
      </div>
    </div>
  );
}
