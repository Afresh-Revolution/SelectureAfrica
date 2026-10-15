import Link from "next/link";
import { redirect } from "next/navigation";
import { PartnerForm } from "@/components/workforce/WorkforceForms";
import { testPartner } from "@/features/workforce/actions";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function PartnersPage() {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "partners")) {
    return (
      <div>
        <h1>Partners</h1>
        <p className="muted">Webhooks for payroll and HR events are included with the Workforce plan.</p>
        <Link className="btn btn-primary" href="/dashboard/membership">View membership</Link>
      </div>
    );
  }
  const partners = await sql<{ provider: string; label: string; status: string; lastEventAt: string | null; lastError: string | null }[]>`
    select provider, label, status, last_event_at, last_error
    from partner_integrations
    where organization_id = ${user.organizationId}
    order by created_at desc
  `;
  return (
    <div className="split-page">
      <div>
        <p className="eyebrow">Partners</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 0.6rem" }}>Connected systems</h1>
        <p className="muted">An approved payroll run sends the period and the net total. Bank details are not included. Addresses must be public https endpoints.</p>
        <div className="form-grid" style={{ marginTop: "1rem" }}>
          {partners.map((partner) => (
            <article key={partner.provider} className="card">
              <h2>{partner.label}</h2>
              <p>{partner.provider} · <span className="badge">{partner.status}</span></p>
              <p className="muted">{partner.lastEventAt ? `Last event ${formatDateTime(partner.lastEventAt)}` : "No events yet."}</p>
              {partner.lastError && <p className="alert">{partner.lastError}</p>}
              <form action={testPartner}>
                <input type="hidden" name="provider" value={partner.provider} />
                <button className="btn btn-line" type="submit">Send test</button>
              </form>
            </article>
          ))}
          {partners.length === 0 && <div className="empty">No partners connected.</div>}
        </div>
      </div>
      <PartnerForm />
    </div>
  );
}
