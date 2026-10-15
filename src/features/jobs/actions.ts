"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/features/auth/actions";
import { writeAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { applicationAllowance, getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { scoreMatch } from "@/lib/matching";
import {
  applicationMoveSchema,
  applicationSchema,
  emptyToNull,
  jobSchema,
  splitList,
} from "@/lib/validators";

async function loadProfile(profileId: string) {
  const rows = await sql<
    {
      skills: string[];
      industries: string[];
      experienceYears: number | null;
      city: string | null;
      country: string | null;
      diaspora: boolean;
    }[]
  >`
    select skills, industries, experience_years, city, country, diaspora
    from professional_profiles
    where profile_id = ${profileId}
    limit 1
  `;
  return rows[0] ?? null;
}

async function loadJob(jobId: string) {
  const rows = await sql<
    {
      id: string;
      organizationId: string;
      title: string;
      status: string;
      skills: string[];
      industries: string[];
      minExperience: number | null;
      city: string | null;
      country: string | null;
      diasporaPreferred: boolean;
    }[]
  >`
    select id, organization_id, title, status, skills, industries, min_experience, city, country, diaspora_preferred
    from jobs where id = ${jobId} limit 1
  `;
  return rows[0] ?? null;
}

export async function saveJob(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId) {
    return { error: "Only an organisation account can post a role." };
  }
  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    city: formData.get("city"),
    country: formData.get("country"),
    employmentType: formData.get("employmentType"),
    seniority: formData.get("seniority"),
    skills: formData.get("skills"),
    industries: formData.get("industries"),
    minExperience: formData.get("minExperience"),
    headcount: formData.get("headcount"),
    salaryMin: formData.get("salaryMin"),
    salaryMax: formData.get("salaryMax"),
    diasporaPreferred: formData.get("diasporaPreferred") === "on",
    status: formData.get("status"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the role." };

  const entitlements = await getEntitlements(user);
  const status = parsed.data.status;
  if (status === "open" && !hasCap(entitlements, "publish_jobs")) {
    return {
      error:
        "Publishing a role needs the Employer or Workforce plan. You can still save a draft.",
    };
  }

  const jobId = String(formData.get("jobId") ?? "");
  const values = parsed.data;
  const publishedAt = status === "open" ? new Date() : null;

  if (jobId) {
    const owned = await sql<{ id: string; status: string }[]>`
      select id, status from jobs where id = ${jobId} and organization_id = ${user.organizationId} limit 1
    `;
    if (!owned[0]) return { error: "That role is not on this organisation." };
    await sql`
      update jobs set
        title = ${values.title},
        summary = ${values.summary},
        description = ${values.description},
        city = ${emptyToNull(values.city)},
        country = ${emptyToNull(values.country)},
        employment_type = ${values.employmentType},
        seniority = ${emptyToNull(values.seniority)},
        skills = ${splitList(values.skills)},
        industries = ${splitList(values.industries)},
        min_experience = ${values.minExperience ?? null},
        headcount = ${values.headcount ?? 1},
        salary_min = ${values.salaryMin ?? null},
        salary_max = ${values.salaryMax ?? null},
        diaspora_preferred = ${values.diasporaPreferred},
        status = ${status},
        published_at = case when ${status} = 'open' then coalesce(published_at, now()) else published_at end,
        updated_at = now()
      where id = ${jobId}
    `;
    revalidatePath(`/dashboard/jobs/${jobId}`);
    revalidatePath("/jobs");
    return { success: "Role saved." };
  }

  const inserted = await sql<{ id: string }[]>`
    insert into jobs (
      organization_id, created_by, title, summary, description, city, country, employment_type,
      seniority, skills, industries, min_experience, headcount, salary_min, salary_max,
      diaspora_preferred, status, published_at
    ) values (
      ${user.organizationId},
      ${user.id},
      ${values.title},
      ${values.summary},
      ${values.description},
      ${emptyToNull(values.city)},
      ${emptyToNull(values.country)},
      ${values.employmentType},
      ${emptyToNull(values.seniority)},
      ${splitList(values.skills)},
      ${splitList(values.industries)},
      ${values.minExperience ?? null},
      ${values.headcount ?? 1},
      ${values.salaryMin ?? null},
      ${values.salaryMax ?? null},
      ${values.diasporaPreferred},
      ${status},
      ${publishedAt}
    )
    returning id
  `;
  await writeAudit({
    actorId: user.id,
    action: "job.create",
    entityType: "job",
    entityId: inserted[0].id,
  });
  redirect(`/dashboard/jobs/${inserted[0].id}`);
}

export async function deleteJob(formData: FormData) {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId) {
    redirect("/dashboard/jobs");
  }
  const jobId = String(formData.get("jobId") ?? "");
  const deleted = await sql<{ id: string; title: string }[]>`
    delete from jobs
    where id = ${jobId} and organization_id = ${user.organizationId}
    returning id, title
  `;
  if (!deleted.length) redirect("/dashboard/jobs");
  await writeAudit({
    actorId: user.id,
    action: "job.deleted",
    entityType: "job",
    entityId: deleted[0].id,
    metadata: { title: deleted[0].title },
  });
  revalidatePath("/dashboard/jobs");
  revalidatePath("/jobs");
  revalidatePath("/dashboard/analytics");
  redirect("/dashboard/jobs");
}

export async function applyToJob(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "professional")
    return { error: "Applications are made from a professional account." };
  const parsed = applicationSchema.safeParse({
    jobId: formData.get("jobId"),
    coverNote: formData.get("coverNote"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the application.",
    };

  const job = await loadJob(parsed.data.jobId);
  if (!job || job.status !== "open") return { error: "That role is not open." };
  const profile = await loadProfile(user.id);
  if (!profile)
    return { error: "Complete your professional profile before applying." };

  const entitlements = await getEntitlements(user);
  const allowance = await applicationAllowance(user.id, entitlements);
  const existing = await sql<{ id: string }[]>`
    select id from applications where job_id = ${job.id} and profile_id = ${user.id} limit 1
  `;
  if (!existing.length && !allowance.allowed) {
    return {
      error:
        "The free plan includes one application. Select or Fellow removes that limit.",
    };
  }

  const match = scoreMatch(profile, job);
  const invited = await sql<{ id: string }[]>`
    select id from job_invites where job_id = ${job.id} and profile_id = ${user.id} limit 1
  `;

  if (existing.length) {
    await sql`
      update applications set
        cover_note = ${emptyToNull(parsed.data.coverNote)},
        match_score = ${match.score},
        match_reasons = ${sql.json(match.reasons)},
        updated_at = now()
      where id = ${existing[0].id} and status = 'applied'
    `;
  } else {
    const inserted = await sql<{ id: string }[]>`
      insert into applications (
        job_id, profile_id, cover_note, match_score, match_reasons, priority, source
      ) values (
        ${job.id},
        ${user.id},
        ${emptyToNull(parsed.data.coverNote)},
        ${match.score},
        ${sql.json(match.reasons)},
        ${hasCap(entitlements, "priority")},
        ${invited.length ? "invited" : "member"}
      )
      returning id
    `;
    await sql`
      insert into application_events (application_id, actor_id, status, message)
      values (${inserted[0].id}, ${user.id}, 'applied', ${"Application received."})
    `;
  }

  revalidatePath(`/jobs/${job.id}`);
  revalidatePath("/dashboard/applications");
  return { success: `Application recorded. Match score ${match.score}.` };
}

export async function updateApplicationNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "professional")
    return { error: "Only the applicant can edit this application." };
  const applicationId = String(formData.get("applicationId") ?? "");
  const parsed = applicationSchema.safeParse({
    jobId: formData.get("jobId"),
    coverNote: formData.get("coverNote"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the application.",
    };

  const updated = await sql<{ id: string }[]>`
    update applications set cover_note = ${emptyToNull(parsed.data.coverNote)}, updated_at = now()
    where id = ${applicationId} and job_id = ${parsed.data.jobId} and profile_id = ${user.id}
    returning id
  `;
  if (!updated.length)
    return { error: "You can only edit your own applications." };
  await sql`
    insert into application_events (application_id, actor_id, message)
    values (${applicationId}, ${user.id}, 'Applicant updated their note.')
  `;
  await writeAudit({
    actorId: user.id,
    action: "application.updated",
    entityType: "application",
    entityId: applicationId,
  });
  revalidatePath("/dashboard/applications");
  redirect("/dashboard/applications");
}

export async function deleteApplication(formData: FormData) {
  const user = await requireUser();
  if (user.accountType !== "professional") redirect("/dashboard");
  const applicationId = String(formData.get("applicationId") ?? "");
  const deleted = await sql<{ id: string; jobId: string }[]>`
    delete from applications
    where id = ${applicationId} and profile_id = ${user.id}
    returning id, job_id
  `;
  if (!deleted.length) redirect("/dashboard/applications");
  await writeAudit({
    actorId: user.id,
    action: "application.deleted",
    entityType: "application",
    entityId: deleted[0].id,
  });
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/jobs/${deleted[0].jobId}`);
  redirect("/dashboard/applications");
}

export async function moveApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "ats") && user.accountType === "corporate") {
    return { error: "Moving applicants needs the Employer or Workforce plan." };
  }
  const parsed = applicationMoveSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
    message: formData.get("message"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the update." };

  const rows = await sql<
    {
      id: string;
      profileId: string;
      jobTitle: string;
      organizationId: string;
      email: string;
    }[]
  >`
    select a.id, a.profile_id, j.title as job_title, j.organization_id, p.email
    from applications a
    join jobs j on j.id = a.job_id
    join profiles p on p.id = a.profile_id
    where a.id = ${parsed.data.applicationId}
    limit 1
  `;
  const application = rows[0];
  if (!application) return { error: "Application not found." };
  const staff =
    user.accountType === "admin" || user.accountType === "super_admin";
  if (
    !staff &&
    application.organizationId !== user.organizationId &&
    application.profileId !== user.id
  ) {
    return { error: "You cannot update this application." };
  }
  if (
    !staff &&
    application.profileId === user.id &&
    parsed.data.status !== "withdrawn"
  ) {
    return {
      error:
        "You can withdraw an application. The employer moves the other stages.",
    };
  }

  const message =
    parsed.data.message?.trim() ||
    `Moved to ${parsed.data.status.replaceAll("_", " ")}.`;
  await sql`
    update applications set status = ${parsed.data.status}, updated_at = now()
    where id = ${application.id}
  `;
  await sql`
    insert into application_events (application_id, actor_id, status, message)
    values (${application.id}, ${user.id}, ${parsed.data.status}, ${message})
  `;
  if (application.profileId !== user.id) {
    await sendMail({
      to: application.email,
      profileId: application.profileId,
      subject: `${application.jobTitle}: ${parsed.data.status.replaceAll("_", " ")}`,
      text: message,
      href: "/dashboard/applications",
    });
  }
  revalidatePath("/dashboard/jobs");
  revalidatePath("/admin/jobs");
  return { success: "Stage updated." };
}

export async function inviteMatch(formData: FormData) {
  const user = await requireUser();
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "ats")) redirect("/dashboard/membership");
  const jobId = String(formData.get("jobId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const job = await loadJob(jobId);
  if (!job || job.organizationId !== user.organizationId) return;

  await sql`
    insert into job_invites (job_id, profile_id, invited_by)
    values (${job.id}, ${profileId}, ${user.id})
    on conflict (job_id, profile_id) do nothing
  `;
  const people = await sql<
    { email: string }[]
  >`select email from profiles where id = ${profileId} limit 1`;
  if (people[0]) {
    await sendMail({
      to: people[0].email,
      profileId,
      subject: `A role may suit you: ${job.title}`,
      text: "An organisation asked Selecture to invite you to review a published role. Your name is not shown to them unless you apply.",
      href: `/jobs/${job.id}`,
    });
  }
  revalidatePath(`/dashboard/jobs/${job.id}`);
}
