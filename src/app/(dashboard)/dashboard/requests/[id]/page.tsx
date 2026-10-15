import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import { deleteServiceRequest } from "@/features/membership/actions";
import { requireUser } from "@/lib/auth";
import { REQUEST_LABELS, STATUS_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { ServiceRequestStatus, ServiceRequestType } from "@/types";

export default async function RequestDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      submittedBy: string;
    }[]
  >`
    select id, reference_code, title, description, request_type, status, location, headcount, urgency, created_at, submitted_by
    from service_requests
    where id = ${id} and organization_id = ${user.organizationId}
    limit 1
  `;
  const request = rows[0];
  if (!request) notFound();
  const updates = await sql<
    {
      id: string;
      message: string;
      status: ServiceRequestStatus | null;
      createdAt: string;
    }[]
  >`
    select id, message, status, created_at
    from request_updates
    where request_id = ${request.id} and visible_to_client = true
    order by created_at asc
  `;
  return (
    <div className="member-request-detail">
      <header className="member-request-header">
        <div>
          <p className="eyebrow">Request {request.referenceCode}</p>
          <h1>{request.title}</h1>
          <span className={`badge badge-${request.status}`}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>
        <div className="member-request-actions">
          {request.submittedBy === user.id && (
            <SubmissionActions
              recordId={request.id}
              idField="requestId"
              editHref={`/dashboard/requests/${request.id}/edit`}
              deleteAction={deleteServiceRequest}
              itemLabel="service request"
            />
          )}
          <Link className="btn btn-line" href="/dashboard/requests">
            All requests
          </Link>
        </div>
      </header>

      <section
        className="card member-request-summary"
        aria-labelledby="request-brief-title"
      >
        <div className="member-request-section-heading">
          <p className="eyebrow">Your instruction</p>
          <h2 id="request-brief-title">Request brief</h2>
        </div>
        <p className="member-request-description">{request.description}</p>
        <dl className="member-request-facts">
          <div>
            <dt>Service</dt>
            <dd>{REQUEST_LABELS[request.requestType]}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{request.location || "Not specified"}</dd>
          </div>
          <div>
            <dt>People</dt>
            <dd>{request.headcount ?? "Not specified"}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd className="member-request-priority">
              {request.urgency.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>
              <time>{formatDateTime(request.createdAt)}</time>
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="member-request-updates"
        aria-labelledby="request-updates-title"
      >
        <div className="member-request-section-heading">
          <p className="eyebrow">Progress</p>
          <h2 id="request-updates-title">Updates</h2>
        </div>
        {updates.length === 0 ? (
          <div className="empty">
            There are no updates yet. Any progress from the Selecture team will
            appear here.
          </div>
        ) : (
          <ol className="member-request-timeline">
            {updates.map((update) => (
              <li key={update.id} className="member-request-update">
                <span
                  className="member-request-timeline-dot"
                  aria-hidden="true"
                />
                <article className="member-request-update-content">
                  <div className="member-request-update-head">
                    <strong>
                      {update.status ? STATUS_LABELS[update.status] : "Note"}
                    </strong>
                    <time className="muted">
                      {formatDateTime(update.createdAt)}
                    </time>
                  </div>
                  <p>{update.message}</p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
