import { sql } from "@/lib/db";

type Mail = {
  to: string;
  subject: string;
  text: string;
  profileId?: string | null;
  href?: string | null;
};

export async function sendMail(mail: Mail) {
  if (mail.profileId) {
    await sql`
      insert into notifications (profile_id, title, body, href)
      values (${mail.profileId}, ${mail.subject}, ${mail.text}, ${mail.href ?? null})
    `;
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return { delivered: false as const };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });

  return { delivered: response.ok };
}

export async function notifyStaff(subject: string, text: string, href?: string) {
  const staff = await sql<{ id: string; email: string }[]>`
    select id, email from profiles
    where account_type in ('admin', 'super_admin')
      and suspended_at is null
  `;
  await Promise.all(
    staff.map((person) =>
      sendMail({
        to: person.email,
        subject,
        text,
        profileId: person.id,
        href,
      }),
    ),
  );
}
