import { setMemberSuspension } from "@/features/admin/actions";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function MembersPage() {
  const actor = await requireStaff();
  const rows = await sql<
    { id: string; fullName: string; email: string; accountType: string; suspendedAt: string | null; createdAt: string; organization: string | null }[]
  >`
    select p.id, p.full_name, p.email, p.account_type, p.suspended_at, p.created_at, o.name as organization
    from profiles p
    left join organization_members om on om.profile_id = p.id
    left join organizations o on o.id = om.organization_id
    where p.account_type in ('corporate', 'professional')
    order by p.created_at desc
  `;
  return (
    <div>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Members</h1>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Type</th><th>Organisation</th><th>Joined</th><th>Standing</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.fullName}</td>
                <td>{row.email}</td>
                <td>{row.accountType}</td>
                <td>{row.organization || "—"}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td>
                  <form action={setMemberSuspension}>
                    <input type="hidden" name="profileId" value={row.id} />
                    <input type="hidden" name="suspend" value={row.suspendedAt ? "0" : "1"} />
                    <button className="btn btn-line" type="submit" disabled={row.id === actor.id}>
                      {row.suspendedAt ? "Reinstate" : "Suspend"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
