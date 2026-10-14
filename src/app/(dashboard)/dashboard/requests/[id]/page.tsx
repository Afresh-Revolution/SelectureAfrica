import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { REQUEST_LABELS, STATUS_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { ServiceRequestStatus, ServiceRequestType } from "@/types";

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
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
      createdAt: string;
    }[]
  >`
    select id, reference_code, title, description, request_type, status, location, headcount, urgency, created_at
    from service_requests
    where id = ${id} and organization_id = ${user.organizationId}
    limit 1
  `;
  const request = rows[0];
  if (!request) notFound();
  const updates = await sql<{ id: string; message: string; status: ServiceRequestStatus | null; createdAt: string }[]>`
    select id, message, status, created_at
    from request_updates
    where request_id = ${request.id} and visible_to_client = true
    order by created_at asc
  `;
  return (
    <div className="split-page">
      <div>
        <p className="eyebrow">{request.referenceCode}</p>
        <h1 style={{ fontSize: "2.6rem", margin: "0.3rem 0 0.6rem" }}>{request.title}</h1>
        <p><span className={`badge badge-${request.status}`}>{STATUS_LABELS[request.status]}</span></p>
        <div className="prose" style={{ marginTop: "1.2rem" }}>
          <p>{request.description}</p>
          <p className="muted">
            {REQUEST_LABELS[request.requestType]}
            {request.location ? ` · ${request.location}` : ""}
            {request.headcount ? ` · ${request.headcount} people` : ""}
            {` · ${request.urgency}`}
          </p>
        </div>
        <p style={{ marginTop: "1rem" }}><Link href="/dashboard/requests">All requests</Link></p>
      </div>
      <div>
        <h2>Updates</h2>
        <ol className="form-grid" style={{ marginTop: "0.8rem", listStyle: "none", padding: 0 }}>
          {updates.map((update) => (
            <li key={update.id} className="card">
              <strong>{update.status ? STATUS_LABELS[update.status] : "Note"}</strong>
              <p>{update.message}</p>
              <p className="muted">{formatDateTime(update.createdAt)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
