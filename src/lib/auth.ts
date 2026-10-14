import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { AccountType, SessionUser } from "@/types";

const COOKIE = "sa_session";
const SESSION_DAYS = 14;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function mapUser(row: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  accountType: AccountType;
  organizationId: string | null;
  organizationName: string | null;
  orgRole: "owner" | "member" | null;
}): SessionUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    accountType: row.accountType,
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    orgRole: row.orgRole,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await sql<
    {
      id: string;
      email: string;
      fullName: string;
      phone: string | null;
      accountType: AccountType;
      organizationId: string | null;
      organizationName: string | null;
      orgRole: "owner" | "member" | null;
    }[]
  >`
    select
      p.id,
      p.email,
      p.full_name,
      p.phone,
      p.account_type,
      o.id as organization_id,
      o.name as organization_name,
      om.role as org_role
    from sessions s
    join profiles p on p.id = s.profile_id
    left join organization_members om on om.profile_id = p.id
    left join organizations o on o.id = om.organization_id
    where s.token_hash = ${hashToken(token)}
      and s.expires_at > now()
      and p.suspended_at is null
    limit 1
  `;

  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createSession(profileId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    insert into sessions (profile_id, token_hash, expires_at)
    values (${profileId}, ${hashToken(token)}, ${expires})
  `;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await sql`delete from sessions where token_hash = ${hashToken(token)}`;
  }
  jar.delete(COOKIE);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.accountType !== "admin" && user.accountType !== "super_admin") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireStaff();
  if (user.accountType !== "super_admin") redirect("/admin");
  return user;
}

export function homeFor(accountType: AccountType) {
  if (accountType === "admin" || accountType === "super_admin") return "/admin";
  return "/dashboard";
}
