import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { formatNaira } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export default async function PayrollDetail({ params }: Props) {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "payroll")) redirect("/dashboard/payroll");
  const { id } = await params;
  const runs = await sql<{ periodLabel: string; status: string; totalGrossKobo: number; totalDeductionsKobo: number; totalNetKobo: number }[]>`
    select period_label, status, total_gross_kobo, total_deductions_kobo, total_net_kobo
    from payroll_runs
    where id = ${id} and organization_id = ${user.organizationId}
    limit 1
  `;
  const run = runs[0];
  if (!run) notFound();
  const lines = await sql<{ fullName: string; roleTitle: string; grossKobo: number; pensionKobo: number; withholdingKobo: number; netKobo: number }[]>`
    select full_name, role_title, gross_kobo, pension_kobo, withholding_kobo, net_kobo
    from payroll_lines
    where run_id = ${id}
    order by full_name
  `;
  return (
    <div>
      <p className="eyebrow">{run.status}</p>
      <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 0.6rem" }}>{run.periodLabel}</h1>
      <p className="muted">
        Gross {formatNaira(run.totalGrossKobo)} · Deductions {formatNaira(run.totalDeductionsKobo)} · Net {formatNaira(run.totalNetKobo)}
      </p>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead>
            <tr><th>Person</th><th>Gross</th><th>Pension</th><th>Withholding</th><th>Net</th></tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.fullName}>
                <td>{line.fullName}<div className="muted">{line.roleTitle}</div></td>
                <td>{formatNaira(line.grossKobo)}</td>
                <td>{formatNaira(line.pensionKobo)}</td>
                <td>{formatNaira(line.withholdingKobo)}</td>
                <td>{formatNaira(line.netKobo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "1rem" }}><Link href="/dashboard/payroll">All runs</Link></p>
    </div>
  );
}
