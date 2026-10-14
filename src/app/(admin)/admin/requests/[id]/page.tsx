import { notFound } from "next/navigation";
import { RequestDesk } from "@/components/admin/RequestDesk";
import { REQUEST_LABELS, STATUS_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { ServiceRequestStatus, ServiceRequestType } from "@/types";

export default async function AdminRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql<
    {
      id: string;
      referenceCode: string;
      title: string;
      description: string;
      requestType: ServiceRequestType;
      status: ServiceRequestStatus;
      location: string | null;
      headcount: number | null;
      urgency: string;
      internalNotes: string | null;
      assignedTo: string | null;
      organization: string;
      contact: string;
      email: string;
    }[]
  >`
    select r.id, r.reference_code, r.title, r.description, r.request_type, r.status, r.location,
      r.headcount, r.urgency, r.internal_notes, r.assigned_to, o.name as organization, p.full_name as contact, p.email
    from service_requests r
    join organizations o on o.id = r.organization_id
    join profiles p on p.id = r.submitted_by
    where r.id = ${id}
    limit 1
  `;
  const request = rows[0];
  if (!request) notFound();
  const updates = await sql<{ id: string; message: string; status: string | null; visibleToClient: boolean; createdAt: string; author: string | null }[]>`
    select u.id, u.message, u.status, u.visible_to_client, u.created_at, p.full_name as author
    from request_updates u
    left join profiles p on p.id = u.author_id
    where u.request_id = ${id}
    order by u.created_at asc
  `;
  const staff = await sql<{ id: string; fullName: string }[]>`
    select id, full_name from profiles
    where account_type in ('admin', 'super_admin') and suspended_at is null
    order by full_name
  `;

  return (
    <div className="split-page">
      <div>
        <p className="eyebrow">{request.referenceCode}</p>
        <h1 style={{ fontSize: "2.4rem" }}>{request.title}</h1>
        <p className="muted" style={{ margin: "0.4rem 0 1rem" }}>
          {request.organization} · {request.contact} · {request.email}
        </p>
        <p>{request.description}</p>
        <p className="muted" style={{ marginTop: "0.8rem" }}>
          {REQUEST_LABELS[request.requestType]} · {request.urgency}
          {request.location ? ` · ${request.location}` : ""}
          {request.headcount ? ` · ${request.headcount}` : ""}
        </p>
        <h2 style={{ marginTop: "1.5rem" }}>History</h2>
        <div className="form-grid" style={{ marginTop: "0.7rem" }}>
          {updates.map((update) => (
            <article key={update.id} className="card">
              <strong>{update.status ? STATUS_LABELS[update.status as ServiceRequestStatus] : "Note"}</strong>
              <p>{update.message}</p>
              <p className="muted">
                {update.author || "System"} · {formatDateTime(update.createdAt)} · {update.visibleToClient ? "Client visible" : "Internal"}
              </p>
            </article>
          ))}
        </div>
      </div>
      <RequestDesk
        requestId={request.id}
        status={request.status}
        internalNotes={request.internalNotes}
        assignedTo={request.assignedTo}
        staff={staff}
      />
    </div>
  );
}
