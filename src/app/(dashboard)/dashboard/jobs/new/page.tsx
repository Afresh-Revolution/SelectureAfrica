import { redirect } from "next/navigation";
import { JobForm } from "@/components/jobs/JobForm";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";

export default async function NewJobPage() {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId) redirect("/dashboard/jobs");
  const entitlements = await getEntitlements(user);
  return (
    <div>
      <p className="eyebrow">New role</p>
      <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", margin: "0.35rem 0 1rem" }}>Describe the work</h1>
      <JobForm canPublish={hasCap(entitlements, "publish_jobs")} />
    </div>
  );
}
