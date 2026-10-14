import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function OrganizationsPage() {
  const rows = await sql<
    { id: string; name: string; industry: string | null; country: string | null; city: string | null; owner: string | null; createdAt: string; requests: string }[]
  >`
    select o.id, o.name, o.industry, o.country, o.city, p.full_name as owner, o.created_at,
      (select count(*)::text from service_requests r where r.organization_id = o.id) as requests
    from organizations o
    left join profiles p on p.id = o.created_by
    order by o.created_at desc
  `;
  return (
    <div>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Organisations</h1>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Name</th><th>Industry</th><th>Location</th><th>Owner</th><th>Requests</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.industry || "—"}</td>
                <td>{[row.city, row.country].filter(Boolean).join(", ") || "—"}</td>
                <td>{row.owner || "—"}</td>
                <td>{row.requests}</td>
                <td>{formatDate(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
