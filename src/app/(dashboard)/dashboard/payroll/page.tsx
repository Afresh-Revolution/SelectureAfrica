import Link from "next/link";
import { redirect } from "next/navigation";
import { PayrollRunForm } from "@/components/workforce/WorkforceForms";
import { approvePayrollRun } from "@/features/workforce/actions";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { formatDate, formatNaira } from "@/lib/format";

export default async function PayrollPage() {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "payroll")) {
    return (
      <div>
        <h1>Payroll</h1>
        <p className="muted">Payroll planning is included with the Workforce plan.</p>
        <Link className="btn btn-primary" href="/dashboard/membership">View membership</Link>
      </div>
    );
  }
  const runs = await sql<{ id: string; periodLabel: string; status: string; totalNetKobo: number; createdAt: string }[]>`
    select id, period_label, status, total_net_kobo, created_at
    from payroll_runs
    where organization_id = ${user.organizationId}
    order by created_at desc
  `;
  return (
    <div className="split-page">
      <div>
        <p className="eyebrow">Payroll</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 0.6rem" }}>Planning runs</h1>
        <p className="muted">Figures estimate 8% pension and 10% withholding. They are not a filing and they do not move money.</p>
        <div className="table-wrap" style={{ marginTop: "1rem" }}>
          <table className="data">
            <thead>
              <tr><th>Period</th><th>Status</th><th>Net</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id}>
                  <td><Link href={`/dashboard/payroll/${run.id}`}>{run.periodLabel}</Link></td>
                  <td><span className="badge">{run.status}</span></td>
                  <td>{formatNaira(run.totalNetKobo)}</td>
                  <td>{formatDate(run.createdAt)}</td>
                  <td>
                    {run.status === "draft" && (
                      <form action={approvePayrollRun}>
                        <input type="hidden" name="runId" value={run.id} />
                        <button className="btn btn-line" type="submit">Approve</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {runs.length === 0 && <tr><td colSpan={5}>No runs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <PayrollRunForm />
    </div>
  );
}
