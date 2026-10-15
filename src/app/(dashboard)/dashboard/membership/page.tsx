import Link from "next/link";
import { CheckoutForm } from "@/components/billing/CheckoutForm";
import { CancelMembership } from "@/components/billing/MembershipForms";
import { requireUser } from "@/lib/auth";
import { getEntitlements, listPlans } from "@/lib/billing";
import { paystackConfigured } from "@/lib/paystack";
import { formatDate, formatNaira } from "@/lib/format";

export default async function MembershipDashboard() {
  const user = await requireUser();
  const [entitlements, plans] = await Promise.all([
    getEntitlements(user),
    listPlans(user.accountType === "corporate" ? "corporate" : "professional"),
  ]);
  const paymentsEnabled = paystackConfigured();
  return (
    <div>
      <p className="eyebrow">Membership</p>
      <h1
        style={{
          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
          margin: "0.35rem 0 0.6rem",
        }}
      >
        {entitlements.planName}
      </h1>
      <p className="muted">
        {entitlements.periodEnd
          ? `Current period runs until ${formatDate(entitlements.periodEnd)}.`
          : "You are on the included plan."}
        {paymentsEnabled
          ? " Paid plans are billed in naira through Paystack."
          : " To discuss a paid plan, contact our team; online checkout is currently unavailable."}
      </p>
      <div className="grid-3 member-plan-grid">
        {plans.map((plan) => (
          <article
            key={plan.code}
            className={`card member-plan-card ${plan.code === entitlements.planCode ? "member-plan-current" : ""}`}
          >
            <h2>{plan.name}</h2>
            {plan.code === entitlements.planCode && (
              <span className="badge badge-confirmed">Current plan</span>
            )}
            <p className="member-plan-price">
              {plan.amountKobo === 0
                ? "Included"
                : `${formatNaira(plan.amountKobo)} / ${plan.interval}`}
            </p>
            <p className="muted">{plan.summary}</p>
            <ul className="prose">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            {plan.code !== entitlements.planCode &&
              plan.amountKobo > 0 &&
              (paymentsEnabled ? (
                <CheckoutForm
                  planCode={plan.code}
                  label="Continue to payment"
                />
              ) : (
                <Link className="btn btn-line" href="/contact">
                  Ask about this plan
                </Link>
              ))}
          </article>
        ))}
      </div>
      {entitlements.planCode && entitlements.planCode !== "staff" && (
        <div className="member-plan-cancel">
          <CancelMembership />
        </div>
      )}
      <p className="member-plan-catalogue">
        <Link href="/membership">Compare all membership plans</Link>
      </p>
    </div>
  );
}
