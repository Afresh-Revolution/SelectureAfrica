import { AssessButton } from "@/components/assessment/AssessButton";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function AssessmentsPage() {
  const user = await requireUser();
  const rows = await sql<{ id: string; kind: string; score: number; band: string; narrative: string; createdAt: string; factors: { label: string; score: number; note: string }[] }[]>`
    select id, kind, score, band, narrative, created_at, factors
    from assessments
    where profile_id = ${user.id} or created_by = ${user.id}
    order by created_at desc
    limit 20
  `;
  return (
    <div>
      <p className="eyebrow">Fit assessment</p>
      <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 0.6rem" }}>A reading, not a decision</h1>
      <p className="muted">
        The model scores skills against a role when one is attached, then experience and learning evidence.
        The note names the strongest signal and the point to test in conversation.
      </p>
      {user.accountType === "professional" && (
        <div style={{ margin: "1rem 0", maxWidth: 360 }}>
          <AssessButton label="Assess my profile" />
        </div>
      )}
      <div className="form-grid">
        {rows.map((row) => (
          <article key={row.id} className="card" style={{ display: "grid", gap: "0.45rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
              <strong>{row.band}</strong>
              <span className="badge">{row.score}</span>
            </div>
            <p>{row.narrative}</p>
            <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
              {(Array.isArray(row.factors) ? row.factors : []).map((factor) => (
                <li key={factor.label}>{factor.label}: {factor.score}. {factor.note}</li>
              ))}
            </ul>
            <p className="muted">{row.kind} · {formatDateTime(row.createdAt)}</p>
          </article>
        ))}
        {rows.length === 0 && <div className="empty">No assessments yet.</div>}
      </div>
    </div>
  );
}
