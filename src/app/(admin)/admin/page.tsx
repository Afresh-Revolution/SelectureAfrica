import Link from "next/link";
import { STATUS_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { ServiceRequestStatus } from "@/types";

export default async function AdminHome() {
  const [members, orgs, openRequests, registrations, feedback] = await Promise.all([
    sql<{ count: string }[]>`select count(*)::text as count from profiles where account_type in ('corporate', 'professional')`,
    sql<{ count: string }[]>`select count(*)::text as count from organizations`,
    sql<{ count: string }[]>`select count(*)::text as count from service_requests where status not in ('completed', 'closed')`,
    sql<{ count: string }[]>`select count(*)::text as count from program_registrations where status = 'submitted'`,
    sql<{ count: string }[]>`select count(*)::text as count from feedback`,
  ]);
  const recent = await sql<
    { id: string; referenceCode: string; title: string; status: ServiceRequestStatus; organization: string; createdAt: string }[]
  >`
    select r.id, r.reference_code, r.title, r.status, o.name as organization, r.created_at
    from service_requests r
    join organizations o on o.id = r.organization_id
    order by r.created_at desc
    limit 6
  `;
  const cards = [
    ["Members", members[0]?.count ?? "0", "/admin/members"],
    ["Organisations", orgs[0]?.count ?? "0", "/admin/organizations"],
    ["Open requests", openRequests[0]?.count ?? "0", "/admin/requests"],
    ["New registrations", registrations[0]?.count ?? "0", "/admin/registrations"],
    ["Feedback", feedback[0]?.count ?? "0", "/admin/feedback"],
  ];
  return (
    <div>
      <p className="eyebrow">Back office</p>
      <h1 style={{ fontSize: "2.8rem", margin: "0.3rem 0 1rem" }}>What needs a person today</h1>
      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="card" style={{ textDecoration: "none" }}>
            <b style={{ fontFamily: "var(--font-serif)", fontSize: "2.2rem", fontWeight: 400 }}>{value}</b>
            <p>{label}</p>
          </Link>
        ))}
      </div>
      <h2>Latest requests</h2>
      <div className="table-wrap" style={{ marginTop: "0.8rem" }}>
        <table className="data">
          <thead>
            <tr><th>Reference</th><th>Organisation</th><th>Title</th><th>Status</th><th>Received</th></tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/admin/requests/${row.id}`}>{row.referenceCode}</Link></td>
                <td>{row.organization}</td>
                <td>{row.title}</td>
                <td><span className={`badge badge-${row.status}`}>{STATUS_LABELS[row.status]}</span></td>
                <td>{formatDateTime(row.createdAt)}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5}>No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
