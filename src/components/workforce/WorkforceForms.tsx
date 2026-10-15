"use client";

import { useActionState } from "react";
import { COUNTRIES } from "@/lib/constants";
import { createPayrollRun, savePartner, saveWorkforceMember } from "@/features/workforce/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function WorkforceForm() {
  const [state, action] = useActionState(saveWorkforceMember, null);
  return (
    <form action={action} className="form-grid card">
      <h2>Add a person</h2>
      <label className="field">
        <span>Name</span>
        <input name="fullName" required />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" />
        </label>
        <label className="field">
          <span>Role</span>
          <input name="roleTitle" required />
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Employment</span>
          <select name="employmentType" defaultValue="permanent">
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="outsourced">Outsourced</option>
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue="active">
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="offboarded">Offboarded</option>
          </select>
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Country</span>
          <select name="country" defaultValue="">
            <option value="">Select</option>
            {COUNTRIES.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Start date</span>
          <input name="startDate" type="date" />
        </label>
      </div>
      <label className="field">
        <span>Monthly gross (NGN)</span>
        <input name="monthlyGross" type="number" min={0} step="0.01" required />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Bank</span>
          <input name="bankName" />
        </label>
        <label className="field">
          <span>Account last four digits</span>
          <input name="accountLast4" inputMode="numeric" maxLength={4} />
        </label>
      </div>
      <p className="muted">Only the last four digits are stored. This register does not hold a full account number.</p>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Saving">Save person</SubmitButton>
    </form>
  );
}

export function PayrollRunForm() {
  const [state, action] = useActionState(createPayrollRun, null);
  return (
    <form action={action} className="form-grid card">
      <h2>New planning run</h2>
      <label className="field">
        <span>Period</span>
        <input name="periodLabel" required placeholder="October 2026" />
      </label>
      <p className="muted">Active people are included. Pension is estimated at 8% and withholding at 10%. These are planning figures, not a statutory filing.</p>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Creating">Create draft</SubmitButton>
    </form>
  );
}

export function PartnerForm() {
  const [state, action] = useActionState(savePartner, null);
  return (
    <form action={action} className="form-grid card">
      <h2>Connect a partner</h2>
      <label className="field">
        <span>Kind</span>
        <select name="provider" defaultValue="webhook">
          <option value="webhook">Webhook</option>
          <option value="slack">Slack incoming webhook</option>
          <option value="hris">HR system</option>
        </select>
      </label>
      <label className="field">
        <span>Label</span>
        <input name="label" required placeholder="Payroll channel" />
      </label>
      <label className="field">
        <span>HTTPS endpoint</span>
        <input name="endpointUrl" type="url" required placeholder="https://" />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Saving">Save connection</SubmitButton>
    </form>
  );
}
