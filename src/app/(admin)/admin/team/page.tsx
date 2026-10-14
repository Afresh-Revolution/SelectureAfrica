import { redirect } from "next/navigation";
import { StaffForm } from "@/components/admin/StaffForm";
import { requireSuperAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function TeamPage() {
  const user = await requireSuperAdmin();
  if (!user) redirect("/admin");
  const rows = await sql<{ id: string; fullName: string; email: string; accountType: string; createdAt: string; suspendedAt: string | null }[]>`
    select id, full_name, email, account_type, created_at, suspended_at
    from profiles
    where account_type in ('admin', 'super_admin')
    order by created_at
  `;
  return (
    <div className="split-page">
      <div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Administrators</h1>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Since</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.fullName}{row.suspendedAt ? " (suspended)" : ""}</td>
                  <td>{row.email}</td>
                  <td>{row.accountType === "super_admin" ? "Super administrator" : "Administrator"}</td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <StaffForm />
    </div>
  );
}
