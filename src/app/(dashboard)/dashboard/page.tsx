import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { ServiceRequestStatus } from "@/types";

export default async function DashboardHome() {
  const user = await requireUser();
  const notes = await sql<{ id: string; title: string; body: string; createdAt: string }[]>`
    select id, title, body, created_at from notifications
    where profile_id = ${user.id}
    order by created_at desc
    limit 5
  `;

  if (user.accountType === "corporate" && user.organizationId) {
    const counts = await sql<{ status: ServiceRequestStatus; count: string }[]>`
      select status, count(*)::text as count
      from service_requests
      where organization_id = ${user.organizationId}
      group by status
    `;
    const open = counts
      .filter((row) => !["completed", "closed"].includes(row.status))
      .reduce((sum, row) => sum + Number(row.count), 0);
    const recent = await sql<{ id: string; referenceCode: string; title: string; status: ServiceRequestStatus; createdAt: string }[]>`
      select id, reference_code, title, status, created_at
      from service_requests
      where organization_id = ${user.organizationId}
      order by created_at desc
      limit 5
    `;
    return (
      <div>
        <p className="eyebrow">Corporate account</p>
        <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 3.4rem)", margin: "0.4rem 0 0.4rem" }}>{user.organizationName}</h1>
        <p className="muted">Requests are reviewed by Selecture staff. Status changes appear here and by email when delivery is configured.</p>
        <div className="kpis" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.4rem 0" }}>
          <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{open}</b><p>Open requests</p></article>
          <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{counts.reduce((s, r) => s + Number(r.count), 0)}</b><p>All requests</p></article>
        </div>
        <Link className="btn btn-primary" href="/dashboard/requests/new">New service request</Link>
        <h2 style={{ margin: "2rem 0 0.8rem" }}>Recent requests</h2>
        <RequestTable rows={recent} />
        <Notes notes={notes} />
      </div>
    );
  }

  const registrations = await sql<{ title: string; status: string }[]>`
    select p.title, r.status
    from program_registrations r
    join programs p on p.id = r.program_id
    where r.profile_id = ${user.id}
    order by r.created_at desc
    limit 5
  `;
  return (
    <div>
      <p className="eyebrow">Professional account</p>
      <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 3.4rem)", margin: "0.4rem 0" }}>{user.fullName}</h1>
      <p className="muted">Your profile and CV stay private to you and Selecture staff.</p>
      <div style={{ display: "flex", gap: "0.7rem", marginTop: "1.2rem", flexWrap: "wrap" }}>
        <Link className="btn btn-primary" href="/dashboard/profile">Complete profile</Link>
        <Link className="btn btn-line" href="/programs">Browse programmes</Link>
      </div>
      <h2 style={{ margin: "2rem 0 0.8rem" }}>Programme registrations</h2>
      {registrations.length === 0 ? (
        <div className="empty">No registrations yet.</div>
      ) : (
        <ul className="prose">
          {registrations.map((item) => (
            <li key={item.title}>
              {item.title} · {item.status}
            </li>
          ))}
        </ul>
      )}
      <Notes notes={notes} />
    </div>
  );
}

function RequestTable({
  rows,
}: {
  rows: { id: string; referenceCode: string; title: string; status: ServiceRequestStatus; createdAt: string }[];
}) {
  if (!rows.length) return <div className="empty">No requests yet.</div>;
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Request</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={`/dashboard/requests/${row.id}`}>{row.referenceCode}</Link>
              </td>
              <td>{row.title}</td>
              <td>
                <span className={`badge badge-${row.status}`}>{STATUS_LABELS[row.status]}</span>
              </td>
              <td>{formatDate(row.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Notes({ notes }: { notes: { id: string; title: string; body: string; createdAt: string }[] }) {
  if (!notes.length) return null;
  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Messages</h2>
      <div className="form-grid" style={{ marginTop: "0.8rem" }}>
        {notes.map((note) => (
          <article key={note.id} className="card">
            <strong>{note.title}</strong>
            <p className="muted">{note.body}</p>
            <p>{formatDate(note.createdAt)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
