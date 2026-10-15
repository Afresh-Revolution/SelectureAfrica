"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { notifyStaff, sendMail } from "@/lib/email";
import { referenceCode } from "@/lib/format";
import { REQUEST_LABELS } from "@/lib/constants";
import {
  contactSchema,
  emptyToNull,
  feedbackSchema,
  organizationSchema,
  preferencesSchema,
  professionalProfileSchema,
  programRegistrationSchema,
  serviceRequestSchema,
  splitList,
} from "@/lib/validators";
import type { ActionState } from "@/features/auth/actions";

export async function updateOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user.organizationId || user.orgRole !== "owner")
    return { error: "Only the organisation owner can edit this profile." };
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    website: formData.get("website"),
    country: formData.get("country"),
    city: formData.get("city"),
    sizeBand: formData.get("sizeBand"),
    about: formData.get("about"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  await sql`
    update organizations set
      name = ${parsed.data.name},
      industry = ${emptyToNull(parsed.data.industry)},
      website = ${emptyToNull(parsed.data.website)},
      country = ${emptyToNull(parsed.data.country)},
      city = ${emptyToNull(parsed.data.city)},
      size_band = ${emptyToNull(parsed.data.sizeBand)},
      about = ${emptyToNull(parsed.data.about)},
      updated_at = now()
    where id = ${user.organizationId}
  `;
  revalidatePath("/dashboard/organization");
  return { success: "Organisation profile saved." };
}

export async function addContact(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!user.organizationId)
    return { error: "Create an organisation profile first." };
  const parsed = contactSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    jobTitle: formData.get("jobTitle"),
    phone: formData.get("phone"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the contact." };

  await sql`
    insert into organization_contacts (organization_id, full_name, email, phone, job_title)
    values (
      ${user.organizationId},
      ${parsed.data.fullName},
      ${parsed.data.email},
      ${emptyToNull(parsed.data.phone)},
      ${emptyToNull(parsed.data.jobTitle)}
    )
  `;
  revalidatePath("/dashboard/organization");
  return { success: "Contact added." };
}

export async function removeContact(formData: FormData) {
  const user = await requireUser();
  if (!user.organizationId) return;
  const id = String(formData.get("id") ?? "");
  await sql`
    delete from organization_contacts
    where id = ${id} and organization_id = ${user.organizationId}
  `;
  revalidatePath("/dashboard/organization");
}

export async function createServiceRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId) {
    return {
      error: "Service requests are submitted from a corporate account.",
    };
  }
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  const parsed = serviceRequestSchema.safeParse({
    requestType: formData.get("requestType"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    headcount: headcountRaw === "" ? undefined : headcountRaw,
    urgency: formData.get("urgency"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the request." };

  const code = referenceCode();
  const rawHeadcount = parsed.data.headcount;
  const headcount =
    typeof rawHeadcount === "number" && Number.isFinite(rawHeadcount)
      ? rawHeadcount
      : null;
  const created = await sql<{ id: string }[]>`
    insert into service_requests (
      reference_code, organization_id, submitted_by, request_type, title, description, location, headcount, urgency
    ) values (
      ${code},
      ${user.organizationId},
      ${user.id},
      ${parsed.data.requestType},
      ${parsed.data.title},
      ${parsed.data.description},
      ${emptyToNull(parsed.data.location)},
      ${headcount},
      ${parsed.data.urgency}
    )
    returning id
  `;
  await sql`
    insert into request_updates (request_id, author_id, status, message, visible_to_client)
    values (${created[0].id}, ${user.id}, 'submitted', 'Request received by Selecture Africa.', true)
  `;
  await writeAudit({
    actorId: user.id,
    action: "request.created",
    entityType: "service_request",
    entityId: created[0].id,
    metadata: { reference: code },
  });
  await sendMail({
    to: user.email,
    profileId: user.id,
    subject: `Request ${code} received`,
    text: `We have received your ${REQUEST_LABELS[parsed.data.requestType]} request “${parsed.data.title}”. A consultant will review it and update the status in your dashboard.`,
    href: `/dashboard/requests/${created[0].id}`,
  });
  await notifyStaff(
    `Corporate request ${code}`,
    `${user.organizationName ?? "An organisation"} submitted ${REQUEST_LABELS[parsed.data.requestType]}: ${parsed.data.title}.`,
    `/admin/requests/${created[0].id}`,
  );
  redirect(`/dashboard/requests/${created[0].id}`);
}

export async function updateServiceRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId)
    return { error: "Service requests belong to an organisation account." };
  const requestId = String(formData.get("requestId") ?? "");
  const headcountRaw = String(formData.get("headcount") ?? "").trim();
  const parsed = serviceRequestSchema.safeParse({
    requestType: formData.get("requestType"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    headcount: headcountRaw === "" ? undefined : headcountRaw,
    urgency: formData.get("urgency"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the request." };

  const rawHeadcount = parsed.data.headcount;
  const headcount =
    typeof rawHeadcount === "number" && Number.isFinite(rawHeadcount)
      ? rawHeadcount
      : null;
  const updated = await sql<{ id: string }[]>`
    update service_requests set
      request_type = ${parsed.data.requestType},
      title = ${parsed.data.title},
      description = ${parsed.data.description},
      location = ${emptyToNull(parsed.data.location)},
      headcount = ${headcount},
      urgency = ${parsed.data.urgency},
      updated_at = now()
    where id = ${requestId}
      and organization_id = ${user.organizationId}
      and submitted_by = ${user.id}
    returning id
  `;
  if (!updated.length)
    return { error: "You can only edit requests you submitted." };

  await sql`
    insert into request_updates (request_id, author_id, message, visible_to_client)
    values (${requestId}, ${user.id}, 'The submitting organisation updated the request details.', true)
  `;
  await writeAudit({
    actorId: user.id,
    action: "request.updated",
    entityType: "service_request",
    entityId: requestId,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/requests/${requestId}`);
  redirect(`/dashboard/requests/${requestId}`);
}

export async function deleteServiceRequest(formData: FormData) {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId)
    redirect("/dashboard");
  const requestId = String(formData.get("requestId") ?? "");
  const deleted = await sql<{ id: string; referenceCode: string }[]>`
    delete from service_requests
    where id = ${requestId}
      and organization_id = ${user.organizationId}
      and submitted_by = ${user.id}
    returning id, reference_code
  `;
  if (!deleted.length) redirect("/dashboard/requests");
  await writeAudit({
    actorId: user.id,
    action: "request.deleted",
    entityType: "service_request",
    entityId: deleted[0].id,
    metadata: { reference: deleted[0].referenceCode },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  redirect("/dashboard/requests");
}

export async function updateProfessionalProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "professional")
    return { error: "This profile belongs to individual members." };
  const yearsRaw = String(formData.get("experienceYears") ?? "").trim();
  const parsed = professionalProfileSchema.safeParse({
    headline: formData.get("headline"),
    summary: formData.get("summary"),
    city: formData.get("city"),
    country: formData.get("country"),
    diaspora: formData.get("diaspora") === "on",
    skills: formData.get("skills"),
    experienceYears: yearsRaw === "" ? undefined : yearsRaw,
    industries: formData.get("industries"),
    linkedinUrl: formData.get("linkedinUrl"),
    visibility: formData.get("visibility") || "selecture_only",
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the profile." };

  const rawYears = parsed.data.experienceYears;
  const years =
    typeof rawYears === "number" && Number.isFinite(rawYears) ? rawYears : null;
  await sql`
    insert into professional_profiles (
      profile_id, headline, summary, city, country, diaspora, skills, experience_years, industries, linkedin_url, visibility, updated_at
    ) values (
      ${user.id},
      ${emptyToNull(parsed.data.headline)},
      ${emptyToNull(parsed.data.summary)},
      ${emptyToNull(parsed.data.city)},
      ${emptyToNull(parsed.data.country)},
      ${parsed.data.diaspora},
      ${splitList(parsed.data.skills)},
      ${years},
      ${splitList(parsed.data.industries)},
      ${emptyToNull(parsed.data.linkedinUrl)},
      ${parsed.data.visibility},
      now()
    )
    on conflict (profile_id) do update set
      headline = excluded.headline,
      summary = excluded.summary,
      city = excluded.city,
      country = excluded.country,
      diaspora = excluded.diaspora,
      skills = excluded.skills,
      experience_years = excluded.experience_years,
      industries = excluded.industries,
      linkedin_url = excluded.linkedin_url,
      visibility = excluded.visibility,
      updated_at = now()
  `;
  revalidatePath("/dashboard/profile");
  return { success: "Profile saved. Your CV remains private to Selecture." };
}

const CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function uploadCv(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (user.accountType !== "professional")
    return { error: "Only professional members can store a CV." };
  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Choose a PDF or Word document." };
  if (file.size > 5 * 1024 * 1024)
    return { error: "CVs must be 5 MB or smaller." };
  if (!CV_TYPES.has(file.type))
    return { error: "Upload a PDF or Word document." };

  const bytes = Buffer.from(await file.arrayBuffer());
  await sql`
    insert into cv_documents (profile_id, file_name, mime_type, size_bytes, content)
    values (${user.id}, ${file.name.slice(0, 180)}, ${file.type}, ${file.size}, ${bytes})
    on conflict (profile_id) do update set
      file_name = excluded.file_name,
      mime_type = excluded.mime_type,
      size_bytes = excluded.size_bytes,
      content = excluded.content,
      uploaded_at = now()
  `;
  await writeAudit({
    actorId: user.id,
    action: "cv.uploaded",
    entityType: "cv",
    entityId: user.id,
  });
  revalidatePath("/dashboard/profile");
  return { success: "CV stored in private storage." };
}

export async function registerForProgram(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const programId = String(formData.get("programId") ?? "");
  const parsed = programRegistrationSchema.safeParse({
    motivation: formData.get("motivation"),
  });
  if (!parsed.success) return { error: "Check your registration." };

  const programs = await sql<{ id: string; title: string; status: string }[]>`
    select id, title, status from programs where id = ${programId} limit 1
  `;
  const program = programs[0];
  if (!program || program.status !== "published")
    return { error: "This program is not open." };

  try {
    await sql`
      insert into program_registrations (program_id, profile_id, organization_id, motivation)
      values (${program.id}, ${user.id}, ${user.organizationId}, ${emptyToNull(parsed.data.motivation)})
    `;
  } catch {
    return { error: "You are already registered for this program." };
  }

  await sendMail({
    to: user.email,
    profileId: user.id,
    subject: `Registration received: ${program.title}`,
    text: `Your interest in ${program.title} has been recorded. Selecture will confirm participation separately.`,
    href: "/dashboard/submissions",
  });
  await notifyStaff(
    `Program registration: ${program.title}`,
    `${user.fullName} (${user.email}) registered.`,
    "/admin/registrations",
  );
  revalidatePath("/dashboard/submissions");
  revalidatePath(`/programs/${programId}`);
  return {
    success: "Registration received. You can follow it under Submissions.",
  };
}

export async function updateProgramRegistration(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const registrationId = String(formData.get("registrationId") ?? "");
  const parsed = programRegistrationSchema.safeParse({
    motivation: formData.get("motivation"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the registration.",
    };

  const updated = await sql<{ id: string }[]>`
    update program_registrations
    set motivation = ${emptyToNull(parsed.data.motivation)}, updated_at = now()
    where id = ${registrationId} and profile_id = ${user.id}
    returning id
  `;
  if (!updated.length)
    return { error: "You can only edit your own registrations." };
  await writeAudit({
    actorId: user.id,
    action: "registration.updated",
    entityType: "program_registration",
    entityId: registrationId,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/submissions");
  revalidatePath("/dashboard/learning");
  redirect("/dashboard/submissions");
}

export async function deleteProgramRegistration(formData: FormData) {
  const user = await requireUser();
  const registrationId = String(formData.get("registrationId") ?? "");
  const deleted = await sql<{ id: string }[]>`
    delete from program_registrations
    where id = ${registrationId} and profile_id = ${user.id}
    returning id
  `;
  if (!deleted.length) redirect("/dashboard/submissions");
  await writeAudit({
    actorId: user.id,
    action: "registration.deleted",
    entityType: "program_registration",
    entityId: deleted[0].id,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/submissions");
  revalidatePath("/dashboard/learning");
  redirect("/dashboard/submissions");
}

export async function updatePreferences(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = preferencesSchema.safeParse({
    newsletter: formData.get("newsletter") === "on",
    productUpdates: formData.get("productUpdates") === "on",
    requestAlerts: formData.get("requestAlerts") === "on",
  });
  if (!parsed.success) return { error: "Could not save preferences." };
  const unsubscribed = parsed.data.newsletter ? null : new Date();
  await sql`
    insert into notification_preferences (profile_id, newsletter, product_updates, request_alerts, consent_at, unsubscribed_at)
    values (${user.id}, ${parsed.data.newsletter}, ${parsed.data.productUpdates}, ${parsed.data.requestAlerts}, now(), ${unsubscribed})
    on conflict (profile_id) do update set
      newsletter = excluded.newsletter,
      product_updates = excluded.product_updates,
      request_alerts = excluded.request_alerts,
      unsubscribed_at = excluded.unsubscribed_at
  `;
  revalidatePath("/dashboard/preferences");
  return { success: "Communication preferences saved." };
}

export async function submitFeedback(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (String(formData.get("company_website") ?? "").trim())
    return { success: "Thank you. Your message has been received." };
  const parsed = feedbackSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  await sql`
    insert into feedback (full_name, email, topic, message)
    values (${parsed.data.fullName}, ${parsed.data.email.toLowerCase()}, ${parsed.data.topic}, ${parsed.data.message})
  `;
  await notifyStaff(
    `Feedback: ${parsed.data.topic}`,
    `${parsed.data.fullName} (${parsed.data.email}) wrote: ${parsed.data.message.slice(0, 280)}`,
    "/admin/feedback",
  );
  return { success: "Thank you. Your message has been received." };
}

export async function subscribeNewsletter(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (String(formData.get("company_website") ?? "").trim())
    return { success: "You are on the list." };
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email address." };
  await sql`
    insert into newsletter_signups (email, source)
    values (${email}, 'footer')
    on conflict (email) do update set unsubscribed_at = null
  `;
  return { success: "You are on the list." };
}
