import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/forms/ProfileForms";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function ProfilePage() {
  const user = await requireUser();
  if (user.accountType !== "professional") redirect("/dashboard");
  const profiles = await sql<
    {
      headline: string | null;
      summary: string | null;
      city: string | null;
      country: string | null;
      diaspora: boolean;
      skills: string[];
      experienceYears: number | null;
      industries: string[];
      linkedinUrl: string | null;
      visibility: "private" | "selecture_only";
    }[]
  >`
    select headline, summary, city, country, diaspora, skills, experience_years, industries, linkedin_url, visibility
    from professional_profiles where profile_id = ${user.id} limit 1
  `;
  const cvs = await sql<{ fileName: string }[]>`select file_name from cv_documents where profile_id = ${user.id} limit 1`;
  return (
    <div>
      <p className="eyebrow">Profile</p>
      <h1 style={{ fontSize: "2.6rem", marginBottom: "1rem" }}>How Selecture should see you</h1>
      <ProfileEditor profile={profiles[0] ?? null} cvName={cvs[0]?.fileName ?? null} />
    </div>
  );
}
