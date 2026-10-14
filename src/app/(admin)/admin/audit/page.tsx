import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function AuditPage() {
  const rows = await sql<{ id: string; action: string; entityType: string; entityId: string | null; createdAt: string; actor: string | null }[]>`
    select a.id, a.action, a.entity_type, a.entity_id, a.created_at, p.full_name as actor
    from audit_logs a
    left join profiles p on p.id = a.actor_id
    order by a.created_at desc
    limit 200
  `;
  return (
    <div>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Audit log</h1>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Record</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatDateTime(row.createdAt)}</td>
                <td>{row.actor || "System"}</td>
                <td>{row.action}</td>
                <td>{row.entityType}{row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
