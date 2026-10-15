"use client";

import { useEffect, useId, useRef, useState } from "react";

export function ConfirmActionButton({
  children = "Delete",
  message = "Delete this item permanently? This action cannot be undone.",
}: {
  children?: React.ReactNode;
  message?: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        className="btn btn-danger"
        type="button"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="confirm-dialog-content">
          <p className="eyebrow">Please confirm</p>
          <h2 id={`${dialogId}-title`}>Delete this item?</h2>
          <p id={`${dialogId}-description`}>{message}</p>
          <div className="confirm-dialog-actions">
            <button
              className="btn btn-line"
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button className="btn btn-danger" type="submit">
              Delete permanently
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
