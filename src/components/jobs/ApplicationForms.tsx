"use client";

import { useActionState } from "react";
import { APPLICATION_LABELS, APPLICATION_STATUSES } from "@/lib/constants";
import {
  applyToJob,
  moveApplication,
  updateApplicationNote,
} from "@/features/jobs/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ApplyForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState(applyToJob, null);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="jobId" value={jobId} />
      <label className="field">
        <span>Note to the employer</span>
        <textarea
          name="coverNote"
          placeholder="Why this role, in a few sentences."
        />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Sending">Apply</SubmitButton>
    </form>
  );
}

export function EditApplicationForm({
  applicationId,
  jobId,
  coverNote,
}: {
  applicationId: string;
  jobId: string;
  coverNote: string | null;
}) {
  const [state, action] = useActionState(updateApplicationNote, null);
  return (
    <form action={action} className="form-grid card">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="jobId" value={jobId} />
      <label className="field">
        <span>Note to the employer</span>
        <textarea
          name="coverNote"
          maxLength={2000}
          defaultValue={coverNote ?? ""}
        />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Saving">Save changes</SubmitButton>
    </form>
  );
}

export function StageForm({
  applicationId,
  status,
  allowWithdrawOnly = false,
}: {
  applicationId: string;
  status: string;
  allowWithdrawOnly?: boolean;
}) {
  const [state, action] = useActionState(moveApplication, null);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="form-row">
        <label className="field">
          <span>Stage</span>
          <select
            name="status"
            defaultValue={allowWithdrawOnly ? "withdrawn" : status}
          >
            {(allowWithdrawOnly
              ? (["withdrawn"] as const)
              : APPLICATION_STATUSES
            ).map((value) => (
              <option key={value} value={value}>
                {APPLICATION_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Note</span>
          <input name="message" placeholder="What changed" />
        </label>
      </div>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Saving">
        {allowWithdrawOnly ? "Withdraw" : "Update stage"}
      </SubmitButton>
    </form>
  );
}
