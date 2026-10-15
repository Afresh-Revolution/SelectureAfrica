"use client";

import { useActionState } from "react";
import { REQUEST_LABELS } from "@/lib/constants";
import {
  createServiceRequest,
  updateServiceRequest,
} from "@/features/membership/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function RequestForm({
  request,
}: {
  request?: {
    id: string;
    requestType: keyof typeof REQUEST_LABELS;
    title: string;
    description: string;
    location: string | null;
    headcount: number | null;
    urgency: string;
  };
}) {
  const [state, action] = useActionState(
    request ? updateServiceRequest : createServiceRequest,
    null,
  );
  return (
    <form action={action} className="form-grid card">
      {request && <input type="hidden" name="requestId" value={request.id} />}
      <label className="field">
        <span>Service</span>
        <select
          name="requestType"
          required
          defaultValue={request?.requestType ?? "executive_search"}
        >
          {Object.entries(REQUEST_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Title</span>
        <input
          name="title"
          required
          defaultValue={request?.title}
          placeholder="e.g. Finance director, Lagos"
        />
      </label>
      <label className="field">
        <span>What do you need?</span>
        <textarea
          name="description"
          required
          minLength={20}
          defaultValue={request?.description}
          placeholder="Role, context, timing and any constraints the consultant should know."
        />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Location</span>
          <input name="location" defaultValue={request?.location ?? ""} />
        </label>
        <label className="field">
          <span>Headcount</span>
          <input
            name="headcount"
            type="number"
            min={1}
            defaultValue={request?.headcount ?? ""}
          />
        </label>
      </div>
      <label className="field">
        <span>Urgency</span>
        <select name="urgency" defaultValue={request?.urgency ?? "standard"}>
          <option value="standard">Standard</option>
          <option value="priority">Priority</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel={request ? "Saving" : "Submitting"}>
        {request ? "Save changes" : "Submit request"}
      </SubmitButton>
    </form>
  );
}
