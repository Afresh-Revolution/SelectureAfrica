"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth";
import { assessFit } from "@/lib/assessment";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { scoreMatch } from "@/lib/matching";

async function learningStats(profileId: string) {
  const [lessons, done, exams] = await Promise.all([
    sql<{ count: string }[]>`select count(*)::text as count from lessons`,
    sql<{ count: string }[]>`select count(*)::text as count from lesson_progress where profile_id = ${profileId}`,
    sql<{ score: number }[]>`
      select distinct on (exam_id) score
      from exam_attempts
      where profile_id = ${profileId}
      order by exam_id, submitted_at desc
    `,
  ]);
  const scores = exams.map((row) => row.score);
  return {
    lessonsTotal: Number(lessons[0]?.count ?? 0),
    lessonsCompleted: Number(done[0]?.count ?? 0),
    examAverage: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
  };
}

export async function runAssessment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const entitlements = await getEntitlements(user);
  const jobId = String(formData.get("jobId") ?? "");
  const requestedProfile = String(formData.get("profileId") ?? "");
  const staff = user.accountType === "admin" || user.accountType === "super_admin";

  let profileId = user.id;
  let organizationId = user.organizationId;
  let kind = "market";

  if (jobId) {
    if (user.accountType === "corporate" && !hasCap(entitlements, "ats") && !staff) {
      return { error: "Assessments on applicants need the Employer or Workforce plan." };
    }
    const subjectId = staff ? requestedProfile || null : user.accountType === "professional" ? user.id : requestedProfile || null;
    if (!subjectId && !staff) return { error: "Choose a person to assess." };
    const rows = await sql<
      {
        profileId: string;
        organizationId: string;
        title: string;
        skills: string[];
        industries: string[];
        minExperience: number | null;
        city: string | null;
        country: string | null;
        diasporaPreferred: boolean;
      }[]
    >`
      select a.profile_id, j.organization_id, j.title, j.skills, j.industries, j.min_experience, j.city, j.country, j.diaspora_preferred
      from applications a
      join jobs j on j.id = a.job_id
      where a.job_id = ${jobId}
        and (${subjectId}::uuid is null or a.profile_id = ${subjectId})
        and (${staff}::boolean or j.organization_id = ${user.organizationId ?? null} or a.profile_id = ${user.id})
      limit 1
    `;
    const row = rows[0];
    if (!row) return { error: "No application was found for that assessment." };
    if (!staff && user.accountType === "professional" && row.profileId !== user.id) {
      return { error: "You can assess your own application only." };
    }
    profileId = row.profileId;
    organizationId = row.organizationId;
    kind = "role";

    const profile = await sql<
      { skills: string[]; industries: string[]; experienceYears: number | null; city: string | null; country: string | null; diaspora: boolean }[]
    >`
      select skills, industries, experience_years, city, country, diaspora
      from professional_profiles where profile_id = ${profileId} limit 1
    `;
    const person = profile[0];
    if (!person) return { error: "That professional has no profile yet." };
    const match = scoreMatch(person, row);
    const learning = await learningStats(profileId);
    const result = assessFit({
      matchScore: match.score,
      experienceYears: person.experienceYears,
      minExperience: row.minExperience,
      examAverage: learning.examAverage,
      lessonsCompleted: learning.lessonsCompleted,
      lessonsTotal: learning.lessonsTotal,
      roleTitle: row.title,
    });
    await sql`
      insert into assessments (profile_id, job_id, organization_id, created_by, kind, score, band, narrative, factors)
      values (
        ${profileId}, ${jobId}, ${organizationId}, ${user.id}, ${kind},
        ${result.score}, ${result.band}, ${result.narrative}, ${sql.json(result.factors)}
      )
    `;
    revalidatePath("/dashboard/assessments");
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: `${result.band}. Score ${result.score}.` };
  }

  if (user.accountType !== "professional" && !staff) {
    return { error: "A market assessment is available on a professional account." };
  }
  if (!hasCap(entitlements, "certificate") && !staff && user.accountType === "professional") {
    return { error: "Fit assessment is included with Select and Fellow." };
  }
  const profile = await sql<
    { skills: string[]; experienceYears: number | null }[]
  >`select skills, experience_years from professional_profiles where profile_id = ${user.id} limit 1`;
  if (!profile[0]) return { error: "Complete your profile first." };
  const learning = await learningStats(user.id);
  const result = assessFit({
    matchScore: null,
    experienceYears: profile[0].experienceYears,
    minExperience: null,
    examAverage: learning.examAverage,
    lessonsCompleted: learning.lessonsCompleted,
    lessonsTotal: learning.lessonsTotal,
  });
  await sql`
    insert into assessments (profile_id, organization_id, created_by, kind, score, band, narrative, factors)
    values (
      ${user.id}, ${organizationId}, ${user.id}, 'market',
      ${result.score}, ${result.band}, ${result.narrative}, ${sql.json(result.factors)}
    )
  `;
  revalidatePath("/dashboard/assessments");
  return { success: `${result.band}. Score ${result.score}.` };
}
