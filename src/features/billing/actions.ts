"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireUser } from "@/lib/auth";
import { addInterval, getPlan, settleCharge } from "@/lib/billing";
import { sql } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import {
  disableSubscription,
  initializeTransaction,
  paystackConfigured,
  verifyTransaction,
} from "@/lib/paystack";
import type { ActionState } from "@/features/auth/actions";

function origin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function startCheckout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const plan = await getPlan(String(formData.get("planCode") ?? ""));
  if (!plan || plan.amountKobo <= 0) return { error: "Choose a paid plan." };
  if (plan.audience !== user.accountType)
    return { error: "That plan is for a different kind of account." };
  if (!paystackConfigured()) {
    return {
      error:
        "Paystack is not configured yet. Add PAYSTACK_SECRET_KEY and try again.",
    };
  }

  const reference = `SA${randomBytes(12).toString("hex")}`;
  await sql`
    insert into payments (profile_id, organization_id, plan_code, reference, amount_kobo, currency, status)
    values (
      ${user.id},
      ${user.organizationId},
      ${plan.code},
      ${reference},
      ${plan.amountKobo},
      'NGN',
      'pending'
    )
  `;

  try {
    const started = await initializeTransaction({
      email: user.email,
      amountKobo: plan.amountKobo,
      reference,
      callbackUrl: `${origin()}/dashboard/membership/callback`,
      planCode:
        plan.paystackPlanCode ||
        process.env[`PAYSTACK_PLAN_${plan.code.toUpperCase()}`] ||
        null,
      metadata: {
        profile_id: user.id,
        plan_code: plan.code,
        organization_id: user.organizationId ?? "",
      },
    });
    redirect(started.authorization_url);
  } catch (error) {
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT"))
      throw error;
    await sql`update payments set status = 'failed' where reference = ${reference}`;
    return {
      error:
        error instanceof Error
          ? error.message
          : "Paystack could not start checkout.",
    };
  }
}

export async function confirmCheckout(reference: string, profileId: string) {
  const payment = await sql<{ profileId: string }[]>`
    select profile_id from payments where reference = ${reference} limit 1
  `;
  if (!payment[0] || payment[0].profileId !== profileId) {
    return {
      ok: false as const,
      reason: "This payment does not belong to the signed-in account.",
    };
  }
  const charge = await verifyTransaction(reference);
  return settleCharge(charge);
}

export async function cancelMembership(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _prev;
  void _formData;
  const user = await requireUser();
  const rows = await sql<
    {
      id: string;
      paystackSubscriptionCode: string | null;
      paystackEmailToken: string | null;
    }[]
  >`
    select id, paystack_subscription_code, paystack_email_token
    from subscriptions
    where profile_id = ${user.id} and status = 'active' and current_period_end > now()
    order by current_period_end desc
    limit 1
  `;
  const current = rows[0];
  if (!current) return { error: "There is no active membership to cancel." };

  if (
    current.paystackSubscriptionCode &&
    current.paystackEmailToken &&
    paystackConfigured()
  ) {
    try {
      await disableSubscription(
        current.paystackSubscriptionCode,
        current.paystackEmailToken,
      );
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Paystack could not cancel the subscription.",
      };
    }
  }

  await sql`
    update subscriptions set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where id = ${current.id}
  `;
  await writeAudit({
    actorId: user.id,
    action: "membership.cancel",
    entityType: "subscription",
    entityId: current.id,
  });
  revalidatePath("/dashboard/membership");
  return {
    success:
      "Renewal is cancelled. Access continues until the end of the period already paid.",
  };
}

export async function grantMembership(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const plan = await getPlan(String(formData.get("planCode") ?? ""));
  if (!plan) return { error: "Choose a plan." };
  const people = await sql<{ id: string; organizationId: string | null }[]>`
    select p.id, om.organization_id
    from profiles p
    left join organization_members om on om.profile_id = p.id
    where lower(p.email) = ${email}
    limit 1
  `;
  const person = people[0];
  if (!person) return { error: "No account uses that email." };
  if (plan.audience === "corporate" && !person.organizationId) {
    return { error: "That account is not attached to an organisation." };
  }

  const reference = `comp-${randomBytes(16).toString("hex")}`;
  const periodEnd = addInterval(
    new Date(),
    plan.interval === "none" ? "year" : plan.interval,
  );
  await sql`
    update subscriptions set status = 'cancelled', cancelled_at = now(), updated_at = now()
    where profile_id = ${person.id} and status = 'active'
  `;
  await sql`
    insert into subscriptions (profile_id, organization_id, plan_code, status, paystack_reference, current_period_end)
    values (${person.id}, ${person.organizationId}, ${plan.code}, 'active', ${reference}, ${periodEnd})
  `;
  await writeAudit({
    actorId: staff.id,
    action: "membership.grant",
    entityType: "profile",
    entityId: person.id,
    metadata: { plan: plan.code },
  });
  revalidatePath("/admin/billing");
  return { success: `${plan.name} is active for ${email}.` };
}
