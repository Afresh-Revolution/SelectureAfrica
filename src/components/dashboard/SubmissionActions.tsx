import Link from "next/link";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

export function SubmissionActions({
  recordId,
  idField,
  editHref,
  deleteAction,
  itemLabel,
  confirmMessage,
}: {
  recordId: string;
  idField: string;
  editHref: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
  itemLabel: string;
  confirmMessage?: string;
}) {
  return (
    <div className="submission-actions">
      <Link className="btn btn-line" href={editHref}>
        Edit
      </Link>
      <form action={deleteAction}>
        <input type="hidden" name={idField} value={recordId} />
        <ConfirmActionButton
          message={
            confirmMessage ??
            `Delete this ${itemLabel} permanently? This action cannot be undone.`
          }
        />
      </form>
    </div>
  );
}
