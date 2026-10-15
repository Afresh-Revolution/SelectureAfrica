import { GrantMembershipForm } from "@/components/billing/MembershipForms";
import { requireStaff } from "@/lib/auth";
import { listPlans } from "@/lib/billing";
import { sql } from "@/lib/db";
import { formatDate, formatNaira } from "@/lib/format";

export default async function AdminBillingPage() {
  await requireStaff();
  const [plans, subscriptions, payments] = await Promise.all([
    listPlans(),
    sql<{ email: string; plan: string; status: string; periodEnd: string }[]>`
      select p.email, mp.name as plan, s.status, s.current_period_end
      from subscriptions s
      join profiles p on p.id = s.profile_id
      join membership_plans mp on mp.code = s.plan_code
      where s.current_period_end > now() - interval '30 days'
      order by s.created_at desc
      limit 30
    `,
    sql<{ email: string | null; amountKobo: number; status: string; reference: string; createdAt: string }[]>`
      select p.email, pay.amount_kobo, pay.status, pay.reference, pay.created_at
      from payments pay
      left join profiles p on p.id = pay.profile_id
      order by pay.created_at desc
      limit 20
    `,
  ]);
  return (
    <div className="admin-desk">
      <div>
        <p className="eyebrow">Billing</p>
        <h1 className="admin-title">Paystack memberships</h1>
        <h2 style={{ margin: "1rem 0 0.6rem" }}>Current and recent</h2>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Account</th><th>Plan</th><th>Status</th><th>Until</th></tr></thead>
            <tbody>
              {subscriptions.map((row) => (
                <tr key={`${row.email}-${row.periodEnd}`}>
                  <td>{row.email}</td>
                  <td>{row.plan}</td>
                  <td><span className="badge">{row.status}</span></td>
                  <td>{formatDate(row.periodEnd)}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && <tr><td colSpan={4}>No subscriptions yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <h2 style={{ margin: "1.4rem 0 0.6rem" }}>Payments</h2>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Account</th><th>Amount</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {payments.map((row) => (
                <tr key={row.reference}>
                  <td>{row.email ?? "—"}</td>
                  <td>{formatNaira(row.amountKobo)}</td>
                  <td>{row.status}</td>
                  <td>{formatDate(row.createdAt)}</td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={4}>No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <GrantMembershipForm plans={plans.map((plan) => ({ code: plan.code, name: `${plan.name} · ${plan.audience}` }))} />
    </div>
  );
}
