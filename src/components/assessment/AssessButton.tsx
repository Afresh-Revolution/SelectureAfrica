"use client";

import { useActionState } from "react";
import { runAssessment } from "@/features/assessment/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AssessButton({
  jobId,
  profileId,
  label = "Run fit assessment",
}: {
  jobId?: string;
  profileId?: string;
  label?: string;
}) {
  const [state, action] = useActionState(runAssessment, null);
  return (
    <form action={action} className="form-grid">
      {jobId && <input type="hidden" name="jobId" value={jobId} />}
      {profileId && <input type="hidden" name="profileId" value={profileId} />}
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Scoring">{label}</SubmitButton>
    </form>
  );
}
