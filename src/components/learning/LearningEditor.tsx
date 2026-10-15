"use client";

import { useActionState } from "react";
import { addExamQuestion, addLesson } from "@/features/learning/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LessonEditor({ programId }: { programId: string }) {
  const [state, action] = useActionState(addLesson, null);
  return (
    <form action={action} className="form-grid card">
      <h2>Add a lesson</h2>
      <input type="hidden" name="programId" value={programId} />
      <label className="field">
        <span>Title</span>
        <input name="title" required />
      </label>
      <label className="field">
        <span>Summary</span>
        <input name="summary" />
      </label>
      <label className="field">
        <span>Lesson</span>
        <textarea name="body" required />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Video URL</span>
          <input name="videoUrl" type="url" placeholder="https://" />
        </label>
        <label className="field">
          <span>Minutes</span>
          <input name="durationMinutes" type="number" min={1} />
        </label>
      </div>
      <label className="field">
        <span>Order</span>
        <input name="sortOrder" type="number" min={0} defaultValue={1} />
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Adding">Add lesson</SubmitButton>
    </form>
  );
}

export function QuestionEditor({ programId }: { programId: string }) {
  const [state, action] = useActionState(addExamQuestion, null);
  return (
    <form action={action} className="form-grid card">
      <h2>Add a check question</h2>
      <input type="hidden" name="programId" value={programId} />
      <label className="field">
        <span>Question</span>
        <textarea name="prompt" required />
      </label>
      <label className="field">
        <span>Options, separated by commas</span>
        <textarea name="options" required placeholder="First choice, Second choice, Third choice" />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Correct option (1 is the first)</span>
          <input name="correctIndex" type="number" min={1} max={6} required defaultValue={1} />
        </label>
        <label className="field">
          <span>Pass mark %</span>
          <input name="passMark" type="number" min={1} max={100} defaultValue={70} />
        </label>
      </div>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Adding">Add question</SubmitButton>
    </form>
  );
}
