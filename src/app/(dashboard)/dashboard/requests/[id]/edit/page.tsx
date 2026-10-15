import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RequestForm } from "@/components/forms/RequestForm";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { ServiceRequestType } from "@/types";

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.accountType !== "corporate" || !user.organizationId)
    redirect("/dashboard/requests");
  const { id } = await params;
  const rows = await sql<
    {
      id: string;
      referenceCode: string;
      requestType: ServiceRequestType;
      title: string;
      description: string;
      location: string | null;
      headcount: number | null;
      urgency: string;
    }[]
  >`
    select id, reference_code, request_type, title, description, location, headcount, urgency
    from service_requests
    where id = ${id} and organization_id = ${user.organizationId} and submitted_by = ${user.id}
    limit 1
  `;
  const request = rows[0];
  if (!request) notFound();

  return (
    <div className="member-edit-page">
      <p className="eyebrow">Request {request.referenceCode}</p>
      <h1>Edit service request</h1>
      <p className="muted">Update the details attached to this instruction.</p>
      <RequestForm request={request} />
      <p className="member-edit-cancel">
        <Link href={`/dashboard/requests/${request.id}`}>
          Cancel and return to request
        </Link>
      </p>
    </div>
  );
}
