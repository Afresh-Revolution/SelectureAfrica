import Link from "next/link";
import { confirmCheckout } from "@/features/billing/actions";
import { requireUser } from "@/lib/auth";

export default async function MembershipCallback({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const reference = query.reference || query.trxref;
  if (!reference) {
    return (
      <div>
        <h1>Payment not found</h1>
        <p className="muted">Paystack did not return a reference.</p>
        <Link href="/dashboard/membership">Back to membership</Link>
      </div>
    );
  }

  let result: { ok: boolean; reason?: string };
  try {
    result = await confirmCheckout(reference, user.id);
  } catch (error) {
    result = { ok: false, reason: error instanceof Error ? error.message : "Paystack could not be reached." };
  }

  return (
    <div>
      <p className="eyebrow">Paystack</p>
      <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.4rem 0" }}>
        {result.ok ? "Payment received" : "Payment not confirmed"}
      </h1>
      <p className="muted">
        {result.ok
          ? "The membership is active for this account. If the organisation paid, colleagues on that organisation share the corporate tools."
          : result.reason}
      </p>
      <Link className="btn btn-primary" href="/dashboard/membership" style={{ marginTop: "1rem" }}>
        Continue
      </Link>
    </div>
  );
}
