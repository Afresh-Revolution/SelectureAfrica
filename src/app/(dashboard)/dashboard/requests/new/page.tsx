import { redirect } from "next/navigation";
import { RequestForm } from "@/components/forms/RequestForm";
import { requireUser } from "@/lib/auth";

export default async function NewRequestPage() {
  const user = await requireUser();
  if (user.accountType !== "corporate") redirect("/dashboard");
  return (
    <div style={{ maxWidth: 760 }}>
      <p className="eyebrow">New instruction</p>
      <h1 style={{ fontSize: "2.6rem", margin: "0.4rem 0 1rem" }}>Tell us what to take on.</h1>
      <RequestForm />
    </div>
  );
}
