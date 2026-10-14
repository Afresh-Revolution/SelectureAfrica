import { redirect } from "next/navigation";
import { OrganizationEditor } from "@/components/forms/OrganizationEditor";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function OrganizationPage() {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const orgs = await sql<
    {
      name: string;
      industry: string | null;
      website: string | null;
      country: string | null;
      city: string | null;
      sizeBand: string | null;
      about: string | null;
    }[]
  >`
    select name, industry, website, country, city, size_band, about
    from organizations where id = ${user.organizationId} limit 1
  `;
  const contacts = await sql<{ id: string; fullName: string; email: string | null; phone: string | null; jobTitle: string | null }[]>`
    select id, full_name, email, phone, job_title
    from organization_contacts
    where organization_id = ${user.organizationId}
    order by created_at desc
  `;
  return (
    <div>
      <p className="eyebrow">Organisation</p>
      <h1 style={{ fontSize: "2.6rem", marginBottom: "1rem" }}>Company profile</h1>
      <OrganizationEditor organization={orgs[0]} contacts={contacts} canEdit={user.orgRole === "owner"} />
    </div>
  );
}
