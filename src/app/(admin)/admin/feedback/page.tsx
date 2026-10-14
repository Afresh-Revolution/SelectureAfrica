import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function FeedbackPage() {
  const rows = await sql<{ id: string; fullName: string; email: string; topic: string; message: string; createdAt: string }[]>`
    select id, full_name, email, topic, message, created_at from feedback order by created_at desc
  `;
  return (
    <div>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Feedback</h1>
      <div className="form-grid">
        {rows.map((row) => (
          <article key={row.id} className="card">
            <p className="eyebrow">{row.topic}</p>
            <h2 style={{ fontSize: "1.5rem" }}>{row.fullName}</h2>
            <p className="muted">{row.email} · {formatDateTime(row.createdAt)}</p>
            <p>{row.message}</p>
          </article>
        ))}
        {rows.length === 0 && <div className="empty">No messages yet.</div>}
      </div>
    </div>
  );
}
