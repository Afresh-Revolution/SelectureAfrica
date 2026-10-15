import { requireStaff } from "@/lib/auth";
import { hiringAnalytics } from "@/lib/analytics";
import { APPLICATION_LABELS } from "@/lib/constants";
import { formatNaira } from "@/lib/format";

export default async function AdminAnalyticsPage() {
  await requireStaff();
  const report = await hiringAnalytics(null);
  return (
    <div>
      <p className="eyebrow">Analytics</p>
      <h1 className="admin-title">Firm-wide reading</h1>
      <p className="muted">Applications across every organisation. The projection uses the last 90 days.</p>
      <div className="grid-4" style={{ margin: "1.2rem 0" }}>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.applications}</b><p>Applications</p></article>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.hireRate == null ? "—" : `${report.hireRate}%`}</b><p>Hire rate</p></article>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.projectedNextMonth}</b><p>Projected next month</p></article>
        <article className="card"><b style={{ fontFamily: "var(--font-serif)", fontSize: "2rem" }}>{report.certificates}</b><p>Certificates · {report.enrolled} confirmed</p></article>
      </div>
      <div className="grid-2">
        <article className="card">
          <h2>Stages</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            {Object.entries(report.byStatus).map(([status, count]) => (
              <li key={status}>{APPLICATION_LABELS[status as keyof typeof APPLICATION_LABELS] ?? status}: {count}</li>
            ))}
            {Object.keys(report.byStatus).length === 0 && <li>No applications yet.</li>}
          </ul>
        </article>
        <article className="card">
          <h2>Open-role skills</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            {report.gaps.map((gap) => (
              <li key={gap.skill}>{gap.skill}: {gap.demand} roles, {gap.supply} profiles</li>
            ))}
            {report.gaps.length === 0 && <li>No open-role skills yet.</li>}
          </ul>
          <p className="muted" style={{ marginTop: "0.8rem" }}>Approved payroll net, six months: {formatNaira(report.payrollNetKobo)} across {report.payrollRuns} runs.</p>
        </article>
      </div>
    </div>
  );
}
