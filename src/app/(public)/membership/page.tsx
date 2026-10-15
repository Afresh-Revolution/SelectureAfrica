import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/billing/CheckoutForm";
import { getCurrentUser } from "@/lib/auth";
import { listPlans } from "@/lib/billing";
import { formatNaira } from "@/lib/format";

export const metadata: Metadata = {
  title: "Membership",
  description: "Professional and corporate membership plans, billed in naira through Paystack.",
};

export default async function MembershipPage() {
  const [plans, user] = await Promise.all([listPlans(), getCurrentUser()]);
  const groups = [
    { audience: "professional" as const, title: "Professionals" },
    { audience: "corporate" as const, title: "Organisations" },
  ];
  return (
    <>
      <section className="hero-dark" style={{ padding: "4.5rem 0 3.5rem" }}>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: 860 }}>
          <p className="eyebrow" style={{ color: "#e7d3ae" }}>Membership</p>
          <h1 style={{ color: "white", fontSize: "clamp(3rem, 6vw, 4.6rem)", marginTop: "0.6rem" }}>
            Plans for people and for organisations.
          </h1>
          <p className="lede" style={{ color: "#d5dbe6", marginTop: "1rem" }}>
            Paid plans are charged in Nigerian naira through Paystack. A subscription runs for the month or year
            you pay. Cancelling stops the next renewal and leaves the current period in place.
          </p>
        </div>
      </section>
      {groups.map((group) => (
        <section key={group.audience} className="section">
          <div className="container">
            <h2 style={{ marginBottom: "1rem" }}>{group.title}</h2>
            <div className="grid-3">
              {plans.filter((plan) => plan.audience === group.audience).map((plan) => {
                const price = plan.amountKobo === 0 ? "Included" : `${formatNaira(plan.amountKobo)} / ${plan.interval}`;
                const canBuy = user && user.accountType === plan.audience && plan.amountKobo > 0;
                return (
                  <article key={plan.code} className="card" style={{ display: "grid", gap: "0.7rem" }}>
                    <p className="eyebrow">{plan.name}</p>
                    <h3>{price}</h3>
                    <p>{plan.summary}</p>
                    <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    {canBuy ? (
                      <CheckoutForm planCode={plan.code} label="Pay with Paystack" />
                    ) : plan.amountKobo === 0 ? (
                      <Link className="btn btn-line" href={user ? "/dashboard" : plan.audience === "corporate" ? "/register/corporate" : "/register/professional"}>
                        {user ? "Included with your account" : "Create an account"}
                      </Link>
                    ) : (
                      <Link className="btn btn-primary" href={user ? "/dashboard/membership" : plan.audience === "corporate" ? "/register/corporate" : "/register/professional"}>
                        {user ? "Open membership" : "Create an account"}
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
