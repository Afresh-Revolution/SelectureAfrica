import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function NewsletterPage() {
  const publicSignups = await sql<{ email: string; createdAt: string; unsubscribedAt: string | null }[]>`
    select email, created_at, unsubscribed_at from newsletter_signups order by created_at desc
  `;
  const members = await sql<{ email: string; fullName: string; newsletter: boolean }[]>`
    select p.email, p.full_name, n.newsletter
    from notification_preferences n
    join profiles p on p.id = n.profile_id
    order by p.full_name
  `;
  return (
    <div className="split-page">
      <div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Public list</h1>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Email</th><th>Joined</th><th>State</th></tr></thead>
            <tbody>
              {publicSignups.map((row) => (
                <tr key={row.email}>
                  <td>{row.email}</td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>{row.unsubscribedAt ? "Unsubscribed" : "Subscribed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h2>Member preferences</h2>
        <div className="table-wrap" style={{ marginTop: "0.8rem" }}>
          <table className="data">
            <thead><tr><th>Name</th><th>Email</th><th>Briefings</th></tr></thead>
            <tbody>
              {members.map((row) => (
                <tr key={row.email}>
                  <td>{row.fullName}</td>
                  <td>{row.email}</td>
                  <td>{row.newsletter ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
