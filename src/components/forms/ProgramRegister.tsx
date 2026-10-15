"use client";

import { useActionState } from "react";
import {
  registerForProgram,
  updateProgramRegistration,
} from "@/features/membership/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ProgramRegister({ programId }: { programId: string }) {
  const [state, action] = useActionState(registerForProgram, null);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="programId" value={programId} />
      <label className="field">
        <span>Why this course</span>
        <textarea
          name="motivation"
          placeholder="Optional. A few lines on what you want from the course."
        />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Sending">Register interest</SubmitButton>
    </form>
  );
}

export function EditProgramRegistrationForm({
  registrationId,
  motivation,
}: {
  registrationId: string;
  motivation: string | null;
}) {
  const [state, action] = useActionState(updateProgramRegistration, null);
  return (
    <form action={action} className="form-grid card">
      <input type="hidden" name="registrationId" value={registrationId} />
      <label className="field">
        <span>Why this course</span>
        <textarea
          name="motivation"
          maxLength={2000}
          defaultValue={motivation ?? ""}
        />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Saving">Save changes</SubmitButton>
    </form>
  );
}
