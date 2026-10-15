import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hiringAnalytics } from "@/lib/analytics";
import { getEntitlements, hasCap } from "@/lib/billing";
import { APPLICATION_LABELS } from "@/lib/constants";
import { formatNaira } from "@/lib/format";

export default async function AnalyticsPage() {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "analytics")) {
    return (
      <div>
        <h1>Analytics</h1>
        <p className="muted">Hiring forecasts, skill gaps and payroll totals are included with the Workforce plan.</p>
        <Link className="btn btn-primary" href="/dashboard/membership">View membership</Link>
      </div>
    );
  }
  const report = await hiringAnalytics(user.organizationId);
  return (
    <div>
      <p className="eyebrow">Analytics</p>
      <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 0.6rem" }}>What the pipeline is doing</h1>
      <p className="muted">
        The next-month figure projects the average weekly applications from the last 90 days. It is a forecast, not a target.
      </p>
      <div className="grid-4" style={{ margin: "1.2rem 0" }}>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.applications}</b><p>Applications</p></article>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.hireRate == null ? "—" : `${report.hireRate}%`}</b><p>Hire rate</p></article>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.projectedNextMonth}</b><p>Projected next month</p></article>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{formatNaira(report.payrollNetKobo)}</b><p>Approved net, 6 months</p></article>
      </div>
      <div className="grid-2">
        <article className="card">
          <h2>Stages</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem", marginTop: "0.6rem" }}>
            {Object.entries(report.byStatus).map(([status, count]) => (
              <li key={status}>{APPLICATION_LABELS[status as keyof typeof APPLICATION_LABELS] ?? status}: {count}</li>
            ))}
            {Object.keys(report.byStatus).length === 0 && <li>No applications yet.</li>}
          </ul>
        </article>
        <article className="card">
          <h2>Skill demand on open roles</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem", marginTop: "0.6rem" }}>
            {report.gaps.map((gap) => (
              <li key={gap.skill}>{gap.skill}: {gap.demand} open {gap.demand === 1 ? "role" : "roles"}, {gap.supply} visible profiles</li>
            ))}
            {report.gaps.length === 0 && <li>No skills listed on open roles.</li>}
          </ul>
        </article>
      </div>
    </div>
  );
}
