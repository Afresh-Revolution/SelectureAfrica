"use client";

import { useActionState } from "react";
import { REQUEST_LABELS } from "@/lib/constants";
import { createServiceRequest } from "@/features/membership/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function RequestForm() {
  const [state, action] = useActionState(createServiceRequest, null);
  return (
    <form action={action} className="form-grid card">
      <label className="field">
        <span>Service</span>
        <select name="requestType" required defaultValue="executive_search">
          {Object.entries(REQUEST_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Title</span>
        <input name="title" required placeholder="e.g. Finance director, Lagos" />
      </label>
      <label className="field">
        <span>What do you need?</span>
        <textarea name="description" required minLength={20} placeholder="Role, context, timing and any constraints the consultant should know." />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Location</span>
          <input name="location" />
        </label>
        <label className="field">
          <span>Headcount</span>
          <input name="headcount" type="number" min={1} />
        </label>
      </div>
      <label className="field">
        <span>Urgency</span>
        <select name="urgency" defaultValue="standard">
          <option value="standard">Standard</option>
          <option value="priority">Priority</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Submitting">Submit request</SubmitButton>
    </form>
  );
}
