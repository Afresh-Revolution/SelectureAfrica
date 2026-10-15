import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkforceForm } from "@/components/workforce/WorkforceForms";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { formatDate, formatNaira } from "@/lib/format";

export default async function WorkforcePage() {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "payroll")) {
    return (
      <div>
        <p className="eyebrow">Workforce</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0" }}>Workforce register</h1>
        <p className="muted">People, roles and monthly gross figures are part of the Workforce plan.</p>
        <Link className="btn btn-primary" href="/dashboard/membership" style={{ marginTop: "1rem" }}>View membership</Link>
      </div>
    );
  }
  const people = await sql<
    { id: string; fullName: string; roleTitle: string; status: string; country: string | null; monthlyGrossKobo: number; accountLast4: string | null; startDate: string | null }[]
  >`
    select id, full_name, role_title, status, country, monthly_gross_kobo, account_last4, start_date
    from workforce_members
    where organization_id = ${user.organizationId}
    order by full_name
  `;
  return (
    <div className="split-page">
      <div>
        <p className="eyebrow">Workforce</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 1rem" }}>People on the register</h1>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Status</th><th>Gross</th><th>Bank</th></tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>{person.fullName}<div className="muted">{[person.country, person.startDate ? formatDate(person.startDate) : null].filter(Boolean).join(" · ")}</div></td>
                  <td>{person.roleTitle}</td>
                  <td><span className="badge">{person.status.replaceAll("_", " ")}</span></td>
                  <td>{formatNaira(person.monthlyGrossKobo)}</td>
                  <td>{person.accountLast4 ? `···· ${person.accountLast4}` : "—"}</td>
                </tr>
              ))}
              {people.length === 0 && <tr><td colSpan={5}>No one on the register yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <WorkforceForm />
    </div>
  );
}
