"use client";

import { useActionState } from "react";
import { STATUS_LABELS } from "@/lib/constants";
import { updateServiceRequest } from "@/features/admin/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function RequestDesk({
  requestId,
  status,
  internalNotes,
  staff,
  assignedTo,
}: {
  requestId: string;
  status: string;
  internalNotes: string | null;
  staff: { id: string; fullName: string }[];
  assignedTo: string | null;
}) {
  const [state, formAction] = useActionState(updateServiceRequest, null);
  return (
    <form action={formAction} className="form-grid card admin-editor">
      <h2>Staff update</h2>
      <input type="hidden" name="requestId" value={requestId} />
      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={status}>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Assign to</span>
        <select name="assignedTo" defaultValue={assignedTo ?? ""}>
          <option value="">Unassigned</option>
          {staff.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" required placeholder="What should be recorded about this step?" />
      </label>
      <label className="check">
        <input type="checkbox" name="visibleToClient" defaultChecked />
        <span>Visible to the client, and sent as a notification.</span>
      </label>
      <label className="field">
        <span>Internal notes</span>
        <textarea name="internalNotes" defaultValue={internalNotes ?? ""} />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Saving">Save update</SubmitButton>
    </form>
  );
}
