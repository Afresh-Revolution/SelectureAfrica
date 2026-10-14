"use server";

import { revalidatePath } from "next/cache";
import { hashPassword, requireStaff, requireSuperAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { sendMail } from "@/lib/email";
import { sql } from "@/lib/db";
import { emptyToNull, insightSchema, programSchema, registrationUpdateSchema, requestUpdateSchema, adminMemberSchema } from "@/lib/validators";
import type { ActionState } from "@/features/auth/actions";

export async function updateServiceRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");
  const parsed = requestUpdateSchema.safeParse({
    status: formData.get("status"),
    message: formData.get("message"),
    visibleToClient: formData.get("visibleToClient") === "on",
    internalNotes: formData.get("internalNotes"),
    assignedTo: formData.get("assignedTo") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the update." };

  const assigned = parsed.data.assignedTo || null;
  const rows = await sql<{ id: string; submittedBy: string; referenceCode: string; title: string }[]>`
    select id, submitted_by, reference_code, title
    from service_requests where id = ${requestId} limit 1
  `;
  const request = rows[0];
  if (!request) return { error: "Request not found." };

  await sql`
    update service_requests set
      status = ${parsed.data.status},
      assigned_to = ${assigned},
      internal_notes = ${emptyToNull(parsed.data.internalNotes)},
      updated_at = now()
    where id = ${requestId}
  `;
  await sql`
    insert into request_updates (request_id, author_id, status, message, visible_to_client)
    values (${requestId}, ${user.id}, ${parsed.data.status}, ${parsed.data.message}, ${parsed.data.visibleToClient})
  `;
  await writeAudit({
    actorId: user.id,
    action: "request.updated",
    entityType: "service_request",
    entityId: requestId,
    metadata: { status: parsed.data.status },
  });

  if (parsed.data.visibleToClient) {
    const owner = await sql<{ email: string }[]>`select email from profiles where id = ${request.submittedBy} limit 1`;
    if (owner[0]) {
      await sendMail({
        to: owner[0].email,
        profileId: request.submittedBy,
        subject: `Update on ${request.referenceCode}`,
        text: parsed.data.message,
        href: `/dashboard/requests/${requestId}`,
      });
    }
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
  revalidatePath(`/dashboard/requests/${requestId}`);
  return { success: "Request updated." };
}

export async function updateRegistration(registrationId: string, formData: FormData) {
  const user = await requireStaff();
  const parsed = registrationUpdateSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) return;
  const rows = await sql<{ profileId: string; title: string }[]>`
    select r.profile_id, p.title
    from program_registrations r
    join programs p on p.id = r.program_id
    where r.id = ${registrationId}
    limit 1
  `;
  await sql`
    update program_registrations
    set status = ${parsed.data.status}, updated_at = now()
    where id = ${registrationId}
  `;
  await writeAudit({
    actorId: user.id,
    action: "registration.updated",
    entityType: "program_registration",
    entityId: registrationId,
    metadata: { status: parsed.data.status },
  });
  const row = rows[0];
  if (row) {
    const person = await sql<{ email: string }[]>`select email from profiles where id = ${row.profileId} limit 1`;
    if (person[0]) {
      await sendMail({
        to: person[0].email,
        profileId: row.profileId,
        subject: `Program update: ${row.title}`,
        text: `Your registration status is now ${parsed.data.status.replace("_", " ")}.`,
        href: "/dashboard/submissions",
      });
    }
  }
  revalidatePath("/admin/registrations");
  revalidatePath("/dashboard/submissions");
}

export async function saveProgram(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const parsed = programSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    duration: formData.get("duration"),
    format: formData.get("format"),
    audience: formData.get("audience"),
    status: formData.get("status"),
    startsOn: formData.get("startsOn"),
    sortOrder: formData.get("sortOrder") || "0",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the program." };
  const id = String(formData.get("id") ?? "");
  const starts = parsed.data.startsOn ? parsed.data.startsOn : null;

  if (id) {
    await sql`
      update programs set
        title = ${parsed.data.title},
        slug = ${parsed.data.slug},
        summary = ${parsed.data.summary},
        description = ${parsed.data.description},
        duration = ${emptyToNull(parsed.data.duration)},
        format = ${emptyToNull(parsed.data.format)},
        audience = ${emptyToNull(parsed.data.audience)},
        status = ${parsed.data.status},
        starts_on = ${starts},
        sort_order = ${parsed.data.sortOrder},
        updated_at = now()
      where id = ${id}
    `;
  } else {
    await sql`
      insert into programs (title, slug, summary, description, duration, format, audience, status, starts_on, sort_order)
      values (
        ${parsed.data.title},
        ${parsed.data.slug},
        ${parsed.data.summary},
        ${parsed.data.description},
        ${emptyToNull(parsed.data.duration)},
        ${emptyToNull(parsed.data.format)},
        ${emptyToNull(parsed.data.audience)},
        ${parsed.data.status},
        ${starts},
        ${parsed.data.sortOrder}
      )
    `;
  }
  await writeAudit({
    actorId: user.id,
    action: id ? "program.updated" : "program.created",
    entityType: "program",
    entityId: id || parsed.data.slug,
  });
  revalidatePath("/admin/programs");
  revalidatePath("/programs");
  return { success: "Program saved." };
}

export async function saveInsight(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStaff();
  const parsed = insightSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    category: formData.get("category"),
    published: formData.get("published") === "on",
    authorName: formData.get("authorName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the article." };
  const id = String(formData.get("id") ?? "");
  if (id) {
    await sql`
      update insights set
        title = ${parsed.data.title},
        slug = ${parsed.data.slug},
        excerpt = ${parsed.data.excerpt},
        body = ${parsed.data.body},
        category = ${parsed.data.category},
        published = ${parsed.data.published},
        published_at = case when ${parsed.data.published} then coalesce(published_at, now()) else null end,
        author_name = ${parsed.data.authorName},
        updated_at = now()
      where id = ${id}
    `;
  } else {
    await sql`
      insert into insights (title, slug, excerpt, body, category, published, published_at, author_name)
      values (
        ${parsed.data.title},
        ${parsed.data.slug},
        ${parsed.data.excerpt},
        ${parsed.data.body},
        ${parsed.data.category},
        ${parsed.data.published},
        ${parsed.data.published ? new Date() : null},
        ${parsed.data.authorName}
      )
    `;
  }
  await writeAudit({
    actorId: user.id,
    action: id ? "insight.updated" : "insight.created",
    entityType: "insight",
    entityId: id || parsed.data.slug,
  });
  revalidatePath("/admin/insights");
  revalidatePath("/insights");
  return { success: "Article saved." };
}

export async function setMemberSuspension(formData: FormData) {
  const user = await requireStaff();
  const profileId = String(formData.get("profileId") ?? "");
  const suspend = formData.get("suspend") === "1";
  const target = await sql<{ accountType: string }[]>`select account_type from profiles where id = ${profileId} limit 1`;
  if (!target[0]) return;
  if (target[0].accountType === "super_admin" && user.accountType !== "super_admin") return;
  if (profileId === user.id) return;
  await sql`
    update profiles
    set suspended_at = ${suspend ? new Date() : null}, updated_at = now()
    where id = ${profileId}
  `;
  if (suspend) await sql`delete from sessions where profile_id = ${profileId}`;
  await writeAudit({
    actorId: user.id,
    action: suspend ? "member.suspended" : "member.reinstated",
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/admin/members");
}

export async function createStaffAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireSuperAdmin();
  const parsed = adminMemberSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    accountType: formData.get("accountType"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the account." };
  const email = parsed.data.email.toLowerCase();
  const existing = await sql`select id from profiles where email = ${email} limit 1`;
  if (existing.length) return { error: "That email is already in use." };
  const passwordHash = await hashPassword(parsed.data.password);
  const created = await sql<{ id: string }[]>`
    insert into profiles (email, password_hash, full_name, account_type, email_verified_at)
    values (${email}, ${passwordHash}, ${parsed.data.fullName}, ${parsed.data.accountType}, now())
    returning id
  `;
  await sql`
    insert into notification_preferences (profile_id, newsletter, product_updates, request_alerts)
    values (${created[0].id}, false, true, true)
  `;
  await writeAudit({
    actorId: user.id,
    action: "staff.created",
    entityType: "profile",
    entityId: created[0].id,
    metadata: { accountType: parsed.data.accountType },
  });
  await sendMail({
    to: email,
    profileId: created[0].id,
    subject: "Your Selecture Africa staff account",
    text: `Hello ${parsed.data.fullName}, a staff account has been created for you. Sign in with the password issued by your administrator and change it after your first visit.`,
    href: "/sign-in",
  });
  revalidatePath("/admin/team");
  return { success: "Staff account created." };
}

export async function markNotificationsRead() {
  const { getCurrentUser } = await import("@/lib/auth");
  const current = await getCurrentUser();
  if (!current) return;
  await sql`update notifications set read_at = now() where profile_id = ${current.id} and read_at is null`;
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}
