import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import { deleteServiceRequest } from "@/features/membership/actions";
import { requireUser } from "@/lib/auth";
import { REQUEST_LABELS, STATUS_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { ServiceRequestStatus, ServiceRequestType } from "@/types";

export default async function RequestsPage() {
  const user = await requireUser();
  if (!user.organizationId) redirect("/dashboard");
  const rows = await sql<
    {
      id: string;
      referenceCode: string;
      title: string;
      requestType: ServiceRequestType;
      status: ServiceRequestStatus;
      createdAt: string;
      submittedBy: string;
    }[]
  >`
    select id, reference_code, title, request_type, status, created_at, submitted_by
    from service_requests
    where organization_id = ${user.organizationId}
    order by created_at desc
  `;
  return (
    <div>
      <div className="section-head">
        <div>
          <p className="eyebrow">Requests</p>
          <h1 style={{ fontSize: "2.6rem" }}>Service instructions</h1>
        </div>
        <Link className="btn btn-primary" href="/dashboard/requests/new">
          New request
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          When you instruct a search or an outsourcing arrangement, it will be
          listed here.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Opened</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/dashboard/requests/${row.id}`}>
                      {row.referenceCode}
                    </Link>
                  </td>
                  <td>{row.title}</td>
                  <td>{REQUEST_LABELS[row.requestType]}</td>
                  <td>
                    <span className={`badge badge-${row.status}`}>
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    {row.submittedBy === user.id && (
                      <SubmissionActions
                        recordId={row.id}
                        idField="requestId"
                        editHref={`/dashboard/requests/${row.id}/edit`}
                        deleteAction={deleteServiceRequest}
                        itemLabel="service request"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
