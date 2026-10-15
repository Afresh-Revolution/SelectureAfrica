"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
    imageUrl: string | null;
    imageAlt: string | null;
  };
}) {
  const [state, action] = useActionState(saveProgram, null);
  const [preview, setPreview] = useState(program?.imageUrl ?? "");
  const [fileName, setFileName] = useState("");
  const [remove, setRemove] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = remove ? "" : preview;

  function assignFile(file: File | undefined) {
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (fileRef.current) fileRef.current.files = transfer.files;
    setRemove(false);
    setFileName(file.name);
    setPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function clearPick() {
    if (fileRef.current) fileRef.current.value = "";
    setFileName("");
    setPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return "";
    });
  }

  function restoreSaved() {
    if (fileRef.current) fileRef.current.value = "";
    setFileName("");
    setRemove(false);
    setPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return program?.imageUrl ?? "";
    });
  }

  useEffect(() => {
    if (state?.success) setRemove(false);
  }, [state]);
  return (
    <form action={action} className="form-grid card admin-editor">
      <h2>{program ? "Edit programme" : "New programme"}</h2>
      {program && <input type="hidden" name="id" value={program.id} />}
      <label className="field"><span>Title</span><input name="title" required defaultValue={program?.title} /></label>
      <label className="field"><span>Slug</span><input name="slug" required defaultValue={program?.slug} /></label>
      <div className="photo-pick">
        <div className="photo-pick-head">
          <span>Photograph</span>
          <em>Optional</em>
        </div>
        <div
          className={`photo-pick-frame${shown ? " has-image" : ""}${dragOver ? " is-over" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            assignFile(event.dataTransfer.files[0]);
          }}
        >
          {program?.imageUrl && (
            <input
              className="photo-pick-input"
              type="checkbox"
              name="removeImage"
              checked={remove}
              onChange={(event) => setRemove(event.target.checked)}
            />
          )}
          <input
            ref={fileRef}
            className="photo-pick-input"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => assignFile(event.target.files?.[0])}
          />
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt={program?.imageAlt || ""} />
          ) : (
            <div className="photo-pick-empty">
              <button type="button" onClick={() => fileRef.current?.click()}>
                <span className="photo-pick-mark" aria-hidden />
                <strong>{remove ? "Photograph will be removed" : "Add a photograph"}</strong>
                <span>{remove ? "Save to confirm, or choose another." : "Drop it here, or choose a file"}</span>
              </button>
              {remove && program?.imageUrl && (
                <button type="button" className="photo-pick-undo" onClick={restoreSaved}>
                  Keep the current photograph
                </button>
              )}
            </div>
          )}
          {shown && (
            <div className="photo-pick-bar">
              <button type="button" onClick={() => fileRef.current?.click()}>Replace</button>
              {program?.imageUrl && preview.startsWith("blob:") ? (
                <button type="button" onClick={restoreSaved}>Undo</button>
              ) : program?.imageUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    clearPick();
                    setRemove(true);
                  }}
                >
                  Remove
                </button>
              ) : (
                <button type="button" onClick={clearPick}>Clear</button>
              )}
            </div>
          )}
        </div>
        <p className="photo-pick-note">{fileName || "JPG, PNG, WEBP or GIF, up to 4 MB. It appears on the home page, the catalogue, and this programme."}</p>
        <label className="field">
          <span>Caption</span>
          <input name="imageAlt" defaultValue={program?.imageAlt ?? ""} placeholder="What the photograph shows" />
        </label>
      </div>
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
    <form action={action} className="form-grid card admin-editor">
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
