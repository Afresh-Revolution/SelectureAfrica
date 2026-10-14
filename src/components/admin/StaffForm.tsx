"use client";

import { useActionState } from "react";
import { createStaffAccount } from "@/features/admin/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function StaffForm() {
  const [state, action] = useActionState(createStaffAccount, null);
  return (
    <form action={action} className="form-grid card admin-editor">
      <h2>New administrator</h2>
      <label className="field"><span>Name</span><input name="fullName" required /></label>
      <label className="field"><span>Email</span><input name="email" type="email" required /></label>
      <label className="field"><span>Temporary password</span><input name="password" type="password" minLength={10} required /></label>
      <label className="field">
        <span>Role</span>
        <select name="accountType" defaultValue="admin">
          <option value="admin">Administrator</option>
          <option value="super_admin">Super administrator</option>
        </select>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Creating">Create account</SubmitButton>
    </form>
  );
}
