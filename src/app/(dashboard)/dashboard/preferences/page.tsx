import { PreferencesForm } from "@/components/forms/ProfileForms";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function PreferencesPage() {
  const user = await requireUser();
  const rows = await sql<{ newsletter: boolean; productUpdates: boolean; requestAlerts: boolean }[]>`
    select newsletter, product_updates, request_alerts
    from notification_preferences where profile_id = ${user.id} limit 1
  `;
  const prefs = rows[0] ?? { newsletter: true, productUpdates: true, requestAlerts: true };
  return (
    <div>
      <p className="eyebrow">Preferences</p>
      <h1 style={{ fontSize: "2.6rem", marginBottom: "1rem" }}>What we may send you</h1>
      <PreferencesForm {...prefs} />
    </div>
  );
}
