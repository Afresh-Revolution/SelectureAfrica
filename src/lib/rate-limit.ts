import { sql } from "@/lib/db";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;

export async function tooManyAttempts(email: string) {
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count
    from login_attempts
    where email = ${email.toLowerCase()}
      and success = false
      and attempted_at > now() - make_interval(mins => ${WINDOW_MINUTES})
  `;
  return Number(rows[0]?.count ?? 0) >= MAX_FAILURES;
}

export async function recordAttempt(email: string, success: boolean) {
  await sql`
    insert into login_attempts (email, success)
    values (${email.toLowerCase()}, ${success})
  `;
}
