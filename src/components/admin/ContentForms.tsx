"use client";

import { useActionState } from "react";
import { saveInsight, saveProgram } from "@/features/admin/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ProgramForm({
  program,
}: {
  program?: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    description: string;
    duration: string | null;
    format: string | null;
    audience: string | null;
    status: string;
    startsOn: string | null;
    sortOrder: number;
  };
}) {
  const [state, action] = useActionState(saveProgram, null);
  return (
    <form action={action} className="form-grid card">
      <h2>{program ? "Edit programme" : "New programme"}</h2>
      {program && <input type="hidden" name="id" value={program.id} />}
      <label className="field"><span>Title</span><input name="title" required defaultValue={program?.title} /></label>
      <label className="field"><span>Slug</span><input name="slug" required defaultValue={program?.slug} /></label>
      <label className="field"><span>Summary</span><textarea name="summary" required defaultValue={program?.summary} /></label>
      <label className="field"><span>Description</span><textarea name="description" required defaultValue={program?.description} /></label>
      <div className="form-row">
        <label className="field"><span>Duration</span><input name="duration" defaultValue={program?.duration ?? ""} /></label>
        <label className="field"><span>Format</span><input name="format" defaultValue={program?.format ?? ""} /></label>
      </div>
      <label className="field"><span>Audience</span><input name="audience" defaultValue={program?.audience ?? ""} /></label>
      <div className="form-row">
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={program?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="field"><span>Starts on</span><input name="startsOn" type="date" defaultValue={program?.startsOn?.slice(0, 10) ?? ""} /></label>
      </div>
      <label className="field"><span>Sort order</span><input name="sortOrder" type="number" defaultValue={program?.sortOrder ?? 0} /></label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton>Save programme</SubmitButton>
    </form>
  );
}

export function InsightForm({
  article,
}: {
  article?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    category: string;
    published: boolean;
    authorName: string;
  };
}) {
  const [state, action] = useActionState(saveInsight, null);
  return (
    <form action={action} className="form-grid card">
      <h2>{article ? "Edit article" : "New article"}</h2>
      {article && <input type="hidden" name="id" value={article.id} />}
      <label className="field"><span>Title</span><input name="title" required defaultValue={article?.title} /></label>
      <label className="field"><span>Slug</span><input name="slug" required defaultValue={article?.slug} /></label>
      <label className="field"><span>Excerpt</span><textarea name="excerpt" required defaultValue={article?.excerpt} /></label>
      <label className="field"><span>Body</span><textarea name="body" required defaultValue={article?.body} style={{ minHeight: 220 }} /></label>
      <div className="form-row">
        <label className="field"><span>Category</span><input name="category" required defaultValue={article?.category ?? "Practice"} /></label>
        <label className="field"><span>Author</span><input name="authorName" required defaultValue={article?.authorName ?? "Selecture Africa"} /></label>
      </div>
      <label className="check">
        <input type="checkbox" name="published" defaultChecked={article?.published ?? false} />
        <span>Published</span>
      </label>
      {state?.error && <p className="alert">{state.error}</p>}
      {state?.success && <p className="alert alert-success">{state.success}</p>}
      <SubmitButton>Save article</SubmitButton>
    </form>
  );
}
