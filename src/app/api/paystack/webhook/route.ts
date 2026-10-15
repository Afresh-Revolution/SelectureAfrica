import { attachPaystackSubscription, settleCharge } from "@/lib/billing";
import { verifyPaystackSignature, type PaystackCharge } from "@/lib/paystack";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(raw, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    event?: string;
    data?: PaystackCharge & {
      subscription_code?: string;
      email_token?: string;
      next_payment_date?: string;
      subscription?: { subscription_code?: string; email_token?: string; next_payment_date?: string };
      customer?: { customer_code?: string; email?: string };
      plan?: { plan_code?: string };
    };
  };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = body.event ?? "";
  const data = body.data;
  if (!data) return Response.json({ received: true });

  if (event === "charge.success") {
    await settleCharge(data);
  }

  const subscriptionCode = data.subscription_code || data.subscription?.subscription_code;
  const emailToken = data.email_token || data.subscription?.email_token;

  if (event === "subscription.create" || event === "subscription.not_renew") {
    await attachPaystackSubscription({
      email: data.customer?.email,
      subscriptionCode,
      emailToken,
      customerCode: data.customer?.customer_code,
      planCode: typeof data.plan === "object" && data.plan ? data.plan.plan_code : undefined,
      nextPaymentDate: data.next_payment_date || data.subscription?.next_payment_date,
    });
  }

  if (event === "subscription.disable" && subscriptionCode) {
    await sql`
      update subscriptions set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()), updated_at = now()
      where paystack_subscription_code = ${subscriptionCode}
    `;
  }

  if (event === "invoice.payment_failed" && subscriptionCode) {
    await sql`
      update subscriptions set status = 'past_due', updated_at = now()
      where paystack_subscription_code = ${subscriptionCode} and status = 'active'
    `;
  }

  return Response.json({ received: true });
}
