import { sql } from "@/lib/db";
import { isStaff } from "@/lib/constants";
import type { PaystackCharge } from "@/lib/paystack";
import { chargeMeta } from "@/lib/paystack";
import type { SessionUser } from "@/types";

export type PlanInterval = "month" | "year" | "none";
export type Capability =
  | "apply_unlimited"
  | "priority"
  | "learn"
  | "certificate"
  | "publish_jobs"
  | "ats"
  | "payroll"
  | "partners"
  | "analytics";

export type MembershipPlan = {
  code: string;
  name: string;
  audience: "professional" | "corporate";
  amountKobo: number;
  interval: PlanInterval;
  summary: string;
  features: string[];
  paystackPlanCode: string | null;
  sortOrder: number;
};

const CAPABILITIES: Record<string, Capability[]> = {
  professional_select: ["apply_unlimited", "learn", "certificate"],
  professional_fellow: ["apply_unlimited", "priority", "learn", "certificate"],
  corporate_employer: ["publish_jobs", "ats"],
  corporate_workforce: ["publish_jobs", "ats", "payroll", "partners", "analytics", "learn", "certificate"],
};

const ALL_CAPS: Capability[] = [
  "apply_unlimited",
  "priority",
  "learn",
  "certificate",
  "publish_jobs",
  "ats",
  "payroll",
  "partners",
  "analytics",
];

export type Entitlements = {
  planCode: string | null;
  planName: string;
  periodEnd: string | null;
  caps: Set<Capability>;
};

export function addInterval(from: Date, interval: PlanInterval) {
  const next = new Date(from);
  if (interval === "year") next.setFullYear(next.getFullYear() + 1);
  else if (interval === "month") next.setMonth(next.getMonth() + 1);
  else next.setFullYear(next.getFullYear() + 10);
  return next;
}

export async function listPlans(audience?: "professional" | "corporate") {
  if (audience) {
    return sql<MembershipPlan[]>`
      select code, name, audience, amount_kobo, interval, summary, features, paystack_plan_code, sort_order
      from membership_plans
      where active = true and audience = ${audience}
      order by sort_order
    `;
  }
  return sql<MembershipPlan[]>`
    select code, name, audience, amount_kobo, interval, summary, features, paystack_plan_code, sort_order
    from membership_plans
    where active = true
    order by audience, sort_order
  `;
}

export async function getPlan(code: string) {
  const rows = await sql<MembershipPlan[]>`
    select code, name, audience, amount_kobo, interval, summary, features, paystack_plan_code, sort_order
    from membership_plans
    where code = ${code} and active = true
    limit 1
  `;
  return rows[0] ?? null;
}

export async function getEntitlements(user: SessionUser): Promise<Entitlements> {
  if (isStaff(user.accountType)) {
    return { planCode: "staff", planName: "Staff", periodEnd: null, caps: new Set(ALL_CAPS) };
  }

  const own = await sql<{ planCode: string; name: string; periodEnd: string }[]>`
    select s.plan_code, mp.name, s.current_period_end
    from subscriptions s
    join membership_plans mp on mp.code = s.plan_code
    where s.profile_id = ${user.id}
      and s.status in ('active', 'cancelled')
      and s.current_period_end > now()
    order by s.current_period_end desc
    limit 1
  `;

  const org = user.organizationId
    ? await sql<{ planCode: string; name: string; periodEnd: string }[]>`
        select s.plan_code, mp.name, s.current_period_end
        from subscriptions s
        join membership_plans mp on mp.code = s.plan_code
        join organization_members om on om.profile_id = s.profile_id
        where om.organization_id = ${user.organizationId}
          and mp.audience = 'corporate'
          and s.status in ('active', 'cancelled')
          and s.current_period_end > now()
        order by s.current_period_end desc
        limit 1
      `
    : [];

  const caps = new Set<Capability>();
  for (const row of [...own, ...org]) {
    for (const cap of CAPABILITIES[row.planCode] ?? []) caps.add(cap);
  }

  const primary = user.accountType === "corporate" ? org[0] ?? own[0] : own[0] ?? org[0];
  return {
    planCode: primary?.planCode ?? null,
    planName: primary?.name ?? (user.accountType === "corporate" ? "Client" : "Member"),
    periodEnd: primary?.periodEnd ?? null,
    caps,
  };
}

export function hasCap(entitlements: Entitlements, cap: Capability) {
  return entitlements.caps.has(cap);
}

export async function applicationAllowance(userId: string, entitlements: Entitlements) {
  if (hasCap(entitlements, "apply_unlimited")) return { allowed: true, used: 0, limit: null as number | null };
  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count
    from applications
    where profile_id = ${userId} and status <> 'withdrawn'
  `;
  const used = Number(rows[0]?.count ?? 0);
  return { allowed: used < 1, used, limit: 1 };
}

export async function settleCharge(charge: PaystackCharge) {
  if (charge.status !== "success") {
    await sql`update payments set status = 'failed', raw = ${sql.json(charge as never)} where reference = ${charge.reference}`;
    return { ok: false as const, reason: "The payment was not successful." };
  }

  const meta = chargeMeta(charge);
  const plan = meta.planCode ? await getPlan(meta.planCode) : null;
  if (!plan || !meta.profileId) return { ok: false as const, reason: "The payment could not be matched to a plan." };
  if (charge.currency !== "NGN" || charge.amount < plan.amountKobo) {
    return { ok: false as const, reason: "The amount paid does not match the plan." };
  }

  const existing = await sql<{ id: string }[]>`
    select id from subscriptions where paystack_reference = ${charge.reference} limit 1
  `;
  const periodEnd = addInterval(charge.paid_at ? new Date(charge.paid_at) : new Date(), plan.interval);

  await sql`
    update payments set
      status = 'success',
      plan_code = ${plan.code},
      channel = ${charge.channel ?? null},
      paid_at = coalesce(${charge.paid_at ?? null}::timestamptz, now()),
      raw = ${sql.json(charge as never)}
    where reference = ${charge.reference}
  `;

  if (!existing.length) {
    await sql`
      update subscriptions set
        status = 'cancelled',
        cancelled_at = now(),
        updated_at = now()
      where profile_id = ${meta.profileId}
        and status = 'active'
        and coalesce(paystack_reference, '') <> ${charge.reference}
    `;
    try {
      await sql`
        insert into subscriptions (
          profile_id, organization_id, plan_code, status, paystack_reference,
          paystack_customer_code, current_period_end
        ) values (
          ${meta.profileId},
          ${meta.organizationId || null},
          ${plan.code},
          'active',
          ${charge.reference},
          ${charge.customer?.customer_code ?? null},
          ${periodEnd}
        )
      `;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "23505") throw error;
    }
  }

  return { ok: true as const, plan };
}

export async function attachPaystackSubscription(input: {
  email?: string;
  subscriptionCode?: string;
  emailToken?: string;
  customerCode?: string;
  planCode?: string;
  nextPaymentDate?: string;
}) {
  if (!input.email || !input.subscriptionCode) return;
  await sql`
    update subscriptions s set
      paystack_subscription_code = ${input.subscriptionCode},
      paystack_email_token = coalesce(${input.emailToken ?? null}, s.paystack_email_token),
      paystack_customer_code = coalesce(${input.customerCode ?? null}, s.paystack_customer_code),
      current_period_end = coalesce(${input.nextPaymentDate ?? null}::timestamptz, s.current_period_end),
      updated_at = now()
    from profiles p
    where p.id = s.profile_id
      and lower(p.email) = lower(${input.email})
      and s.status = 'active'
      and s.current_period_end > now()
  `;
}
