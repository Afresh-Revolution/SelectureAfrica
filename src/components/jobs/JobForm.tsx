"use client";

import { useActionState } from "react";
import { COUNTRIES } from "@/lib/constants";
import { saveJob } from "@/features/jobs/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export type JobDefaults = {
  id?: string;
  title: string;
  summary: string;
  description: string;
  city: string | null;
  country: string | null;
  employmentType: string;
  seniority: string | null;
  skills: string[];
  industries: string[];
  minExperience: number | null;
  headcount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  diasporaPreferred: boolean;
  status: string;
};

export function JobForm({
  job,
  canPublish,
}: {
  job?: JobDefaults;
  canPublish: boolean;
}) {
  const [state, action] = useActionState(saveJob, null);
  return (
    <form
      id={job?.id ? "role-editor" : undefined}
      action={action}
      className="form-grid card"
    >
      {job?.id && <input type="hidden" name="jobId" value={job.id} />}
      <label className="field">
        <span>Title</span>
        <input
          name="title"
          required
          defaultValue={job?.title}
          placeholder="Finance director"
        />
      </label>
      <label className="field">
        <span>Summary</span>
        <input
          name="summary"
          required
          defaultValue={job?.summary ?? ""}
          placeholder="One sentence a candidate can read quickly"
        />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          name="description"
          required
          defaultValue={job?.description}
          placeholder="The work, the context, and what good looks like."
        />
      </label>
      <div className="form-row">
        <label className="field">
          <span>City</span>
          <input name="city" defaultValue={job?.city ?? ""} />
        </label>
        <label className="field">
          <span>Country</span>
          <select name="country" defaultValue={job?.country ?? ""}>
            <option value="">Select</option>
            {COUNTRIES.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Employment</span>
          <select
            name="employmentType"
            defaultValue={job?.employmentType ?? "permanent"}
          >
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="outsourced">Outsourced</option>
          </select>
        </label>
        <label className="field">
          <span>Seniority</span>
          <input
            name="seniority"
            defaultValue={job?.seniority ?? ""}
            placeholder="Director"
          />
        </label>
      </div>
      <label className="field">
        <span>Skills, separated by commas</span>
        <input name="skills" defaultValue={job?.skills.join(", ") ?? ""} />
      </label>
      <label className="field">
        <span>Industries, separated by commas</span>
        <input
          name="industries"
          defaultValue={job?.industries.join(", ") ?? ""}
        />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Minimum years</span>
          <input
            name="minExperience"
            type="number"
            min={0}
            defaultValue={job?.minExperience ?? ""}
          />
        </label>
        <label className="field">
          <span>Headcount</span>
          <input
            name="headcount"
            type="number"
            min={1}
            defaultValue={job?.headcount ?? 1}
          />
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Salary from (NGN)</span>
          <input
            name="salaryMin"
            type="number"
            min={0}
            defaultValue={job?.salaryMin ?? ""}
          />
        </label>
        <label className="field">
          <span>Salary to (NGN)</span>
          <input
            name="salaryMax"
            type="number"
            min={0}
            defaultValue={job?.salaryMax ?? ""}
          />
        </label>
      </div>
      <label className="check">
        <input
          name="diasporaPreferred"
          type="checkbox"
          defaultChecked={job?.diasporaPreferred}
        />
        <span>Diaspora experience is relevant</span>
      </label>
      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue={job?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="open" disabled={!canPublish && job?.status !== "open"}>
            Open
          </option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      {!canPublish && (
        <p className="muted">
          Opening a role to candidates needs the Employer or Workforce plan.
          Drafts can be saved now.
        </p>
      )}
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Saving">Save role</SubmitButton>
    </form>
  );
}
