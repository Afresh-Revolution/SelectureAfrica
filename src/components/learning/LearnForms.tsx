"use client";

import { useActionState } from "react";
import { completeLesson, submitExam } from "@/features/learning/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function CompleteLesson({ lessonId, done }: { lessonId: string; done: boolean }) {
  if (done) return <p className="alert alert-success">Lesson complete.</p>;
  return (
    <form action={completeLesson}>
      <input type="hidden" name="lessonId" value={lessonId} />
      <SubmitButton pendingLabel="Saving">Mark complete</SubmitButton>
    </form>
  );
}

export function ExamForm({
  programId,
  passMark,
  questions,
}: {
  programId: string;
  passMark: number;
  questions: { id: string; prompt: string; options: string[] }[];
}) {
  const [state, action] = useActionState(submitExam, null);
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="programId" value={programId} />
      <p className="muted">Pass mark {passMark}%. You can sit this again.</p>
      {questions.map((question, index) => (
        <fieldset key={question.id} className="card">
          <legend>{index + 1}. {question.prompt}</legend>
          <div className="form-grid" style={{ marginTop: "0.8rem" }}>
            {question.options.map((option, optionIndex) => (
              <label key={option} className="check">
                <input type="radio" name={`q_${question.id}`} value={optionIndex} required />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton pendingLabel="Marking">Submit check</SubmitButton>
    </form>
  );
}
