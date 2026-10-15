import { createHmac, timingSafeEqual } from "crypto";

const API = "https://api.paystack.co";

export type PaystackCharge = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string;
  customer?: { customer_code?: string; email?: string };
  plan?: { plan_code?: string } | string | null;
  metadata?: {
    profile_id?: string;
    plan_code?: string;
    organization_id?: string;
    custom_fields?: { variable_name?: string; value?: string }[];
  };
};

type PaystackEnvelope<T> = { status: boolean; message: string; data: T };

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function verifyPaystackSignature(raw: string, signature: string | null) {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const digest = createHmac("sha512", key).update(raw).digest("hex");
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack is not configured.");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = (await response.json()) as PaystackEnvelope<T> & { message?: string };
  if (!response.ok || body.status === false) {
    throw new Error(body.message || "Paystack could not complete that request.");
  }
  return body.data;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  planCode?: string | null;
  metadata: { profile_id: string; plan_code: string; organization_id: string };
}) {
  return paystack<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      plan: input.planCode || undefined,
      metadata: {
        ...input.metadata,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan_code", value: input.metadata.plan_code },
          { display_name: "Member", variable_name: "profile_id", value: input.metadata.profile_id },
        ],
      },
    }),
  });
}

export async function verifyTransaction(reference: string) {
  return paystack<PaystackCharge>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function disableSubscription(code: string, token: string) {
  await paystack("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code, token }),
  });
}

export function chargeMeta(charge: PaystackCharge) {
  const fields = new Map(
    (charge.metadata?.custom_fields ?? [])
      .filter((field) => field.variable_name && field.value)
      .map((field) => [field.variable_name as string, field.value as string]),
  );
  return {
    profileId: charge.metadata?.profile_id || fields.get("profile_id") || "",
    planCode: charge.metadata?.plan_code || fields.get("plan_code") || "",
    organizationId: charge.metadata?.organization_id || fields.get("organization_id") || "",
  };
}
