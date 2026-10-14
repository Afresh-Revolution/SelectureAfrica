"use server";

import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  hashToken,
  homeFor,
  newToken,
  verifyPassword,
} from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { notifyStaff, sendMail } from "@/lib/email";
import { recordAttempt, tooManyAttempts } from "@/lib/rate-limit";
import { splitList, corporateRegisterSchema, professionalRegisterSchema, resetPasswordSchema, resetRequestSchema, signInSchema } from "@/lib/validators";

export type ActionState = { error?: string; success?: string } | null;

function honeypot(formData: FormData) {
  return String(formData.get("company_website") ?? "").trim().length > 0;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (honeypot(formData)) return { success: "Signed in." };
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const email = parsed.data.email.toLowerCase();
  if (await tooManyAttempts(email)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const rows = await sql<{ id: string; passwordHash: string; accountType: "corporate" | "professional" | "admin" | "super_admin"; suspendedAt: string | null }[]>`
    select id, password_hash, account_type, suspended_at
    from profiles
    where email = ${email}
    limit 1
  `;
  const profile = rows[0];
  const valid = profile ? await verifyPassword(parsed.data.password, profile.passwordHash) : false;
  await recordAttempt(email, Boolean(valid && profile && !profile.suspendedAt));

  if (!profile || !valid) return { error: "Those details do not match an account." };
  if (profile.suspendedAt) return { error: "This account is suspended. Contact Selecture Africa." };

  await createSession(profile.id);
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect(homeFor(profile.accountType));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function registerCorporate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (honeypot(formData)) return { success: "Account created." };
  const parsed = corporateRegisterSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    organizationName: formData.get("organizationName"),
    industry: formData.get("industry"),
    country: formData.get("country"),
    city: formData.get("city"),
    website: formData.get("website"),
    sizeBand: formData.get("sizeBand"),
    newsletter: formData.get("newsletter") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const email = parsed.data.email.toLowerCase();
  const existing = await sql<{ id: string }[]>`select id from profiles where email = ${email} limit 1`;
  if (existing[0]) return { error: "An account with this email already exists. Sign in instead." };

  const passwordHash = await hashPassword(parsed.data.password);
  const profileId = await sql.begin(async (tx) => {
    const created = await tx<{ id: string }[]>`
      insert into profiles (email, password_hash, full_name, phone, account_type, email_verified_at)
      values (${email}, ${passwordHash}, ${parsed.data.fullName}, ${parsed.data.phone || null}, 'corporate', now())
      returning id
    `;
    const id = created[0].id;
    const org = await tx<{ id: string }[]>`
      insert into organizations (name, industry, website, country, city, size_band, created_by)
      values (
        ${parsed.data.organizationName},
        ${parsed.data.industry || null},
        ${parsed.data.website || null},
        ${parsed.data.country || null},
        ${parsed.data.city || null},
        ${parsed.data.sizeBand || null},
        ${id}
      )
      returning id
    `;
    await tx`
      insert into organization_members (organization_id, profile_id, role)
      values (${org[0].id}, ${id}, 'owner')
    `;
    await tx`
      insert into notification_preferences (profile_id, newsletter, consent_at)
      values (${id}, ${parsed.data.newsletter}, now())
    `;
    return id;
  });

  await writeAudit({
    actorId: profileId,
    action: "corporate.registered",
    entityType: "profile",
    entityId: profileId,
  });
  await sendMail({
    to: email,
    profileId,
    subject: "Welcome to Selecture Africa",
    text: `Hello ${parsed.data.fullName}, your organisation account is ready. You can submit recruitment, outsourcing and training requests from your dashboard.`,
    href: "/dashboard",
  });
  await notifyStaff(
    "New corporate membership",
    `${parsed.data.organizationName} registered. Primary contact: ${parsed.data.fullName} (${email}).`,
    "/admin/organizations",
  );
  await createSession(profileId);
  redirect("/dashboard");
}

export async function registerProfessional(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (honeypot(formData)) return { success: "Account created." };
  const parsed = professionalRegisterSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    headline: formData.get("headline"),
    city: formData.get("city"),
    country: formData.get("country"),
    diaspora: formData.get("diaspora") === "on",
    skills: formData.get("skills"),
    newsletter: formData.get("newsletter") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const email = parsed.data.email.toLowerCase();
  const existing = await sql<{ id: string }[]>`select id from profiles where email = ${email} limit 1`;
  if (existing[0]) return { error: "An account with this email already exists. Sign in instead." };

  const passwordHash = await hashPassword(parsed.data.password);
  const skills = splitList(parsed.data.skills);
  const profileId = await sql.begin(async (tx) => {
    const created = await tx<{ id: string }[]>`
      insert into profiles (email, password_hash, full_name, phone, account_type, email_verified_at)
      values (${email}, ${passwordHash}, ${parsed.data.fullName}, ${parsed.data.phone || null}, 'professional', now())
      returning id
    `;
    const id = created[0].id;
    await tx`
      insert into professional_profiles (profile_id, headline, city, country, diaspora, skills)
      values (${id}, ${parsed.data.headline || null}, ${parsed.data.city || null}, ${parsed.data.country || null}, ${parsed.data.diaspora}, ${skills})
    `;
    await tx`
      insert into notification_preferences (profile_id, newsletter, consent_at)
      values (${id}, ${parsed.data.newsletter}, now())
    `;
    return id;
  });

  await writeAudit({
    actorId: profileId,
    action: "professional.registered",
    entityType: "profile",
    entityId: profileId,
  });
  await sendMail({
    to: email,
    profileId,
    subject: "Welcome to Selecture Africa",
    text: `Hello ${parsed.data.fullName}, your professional profile is ready. You can complete your details, store a private CV and register for programs.`,
    href: "/dashboard/profile",
  });
  await notifyStaff(
    "New professional membership",
    `${parsed.data.fullName} (${email}) created a professional profile.`,
    "/admin/members",
  );
  await createSession(profileId);
  redirect("/dashboard");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter the email on your account." };
  const email = parsed.data.email.toLowerCase();
  const rows = await sql<{ id: string }[]>`select id from profiles where email = ${email} and suspended_at is null limit 1`;
  const profile = rows[0];
  if (profile) {
    const token = newToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await sql`
      insert into password_reset_tokens (profile_id, token_hash, expires_at)
      values (${profile.id}, ${hashToken(token)}, ${expires})
    `;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await sendMail({
      to: email,
      profileId: profile.id,
      subject: "Reset your Selecture Africa password",
      text: `Use this link within one hour to choose a new password: ${origin}/reset-password?token=${token}`,
      href: `/reset-password?token=${token}`,
    });
  }
  return { success: "If an account exists for that email, reset instructions have been sent." };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const rows = await sql<{ id: string; profileId: string }[]>`
    select id, profile_id from password_reset_tokens
    where token_hash = ${hashToken(parsed.data.token)}
      and used_at is null
      and expires_at > now()
    limit 1
  `;
  const tokenRow = rows[0];
  if (!tokenRow) return { error: "This reset link is invalid or has expired." };

  const passwordHash = await hashPassword(parsed.data.password);
  await sql.begin(async (tx) => {
    await tx`update profiles set password_hash = ${passwordHash}, updated_at = now() where id = ${tokenRow.profileId}`;
    await tx`update password_reset_tokens set used_at = now() where id = ${tokenRow.id}`;
    await tx`delete from sessions where profile_id = ${tokenRow.profileId}`;
  });
  await writeAudit({
    actorId: tokenRow.profileId,
    action: "password.reset",
    entityType: "profile",
    entityId: tokenRow.profileId,
  });
  redirect("/sign-in?reset=1");
}

export async function redirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.accountType));
}
