import Link from "next/link";
import { REQUEST_LABELS, STATUS_LABELS } from "@/lib/constants";
import { sql } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { ServiceRequestStatus, ServiceRequestType } from "@/types";

export default async function AdminRequests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const allowed = Object.keys(STATUS_LABELS);
  const filter = status && allowed.includes(status) ? status : null;
  const rows = filter
    ? await sql<
        { id: string; referenceCode: string; title: string; requestType: ServiceRequestType; status: ServiceRequestStatus; organization: string; createdAt: string }[]
      >`
        select r.id, r.reference_code, r.title, r.request_type, r.status, o.name as organization, r.created_at
        from service_requests r
        join organizations o on o.id = r.organization_id
        where r.status = ${filter}
        order by r.created_at desc
      `
    : await sql<
        { id: string; referenceCode: string; title: string; requestType: ServiceRequestType; status: ServiceRequestStatus; organization: string; createdAt: string }[]
      >`
        select r.id, r.reference_code, r.title, r.request_type, r.status, o.name as organization, r.created_at
        from service_requests r
        join organizations o on o.id = r.organization_id
        order by r.created_at desc
      `;

  return (
    <div>
      <div className="admin-heading">
        <h1>Service requests</h1>
      </div>
      <nav className="status-filters" aria-label="Filter by status">
        <Link href="/admin/requests" aria-current={filter ? undefined : "page"}>All</Link>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <Link key={value} href={`/admin/requests?status=${value}`} aria-current={filter === value ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Reference</th><th>Organisation</th><th>Type</th><th>Title</th><th>Status</th><th>Received</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6}>No requests in this view.</td></tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td><Link href={`/admin/requests/${row.id}`}>{row.referenceCode}</Link></td>
                <td>{row.organization}</td>
                <td>{REQUEST_LABELS[row.requestType]}</td>
                <td>{row.title}</td>
                <td><span className={`badge badge-${row.status}`}>{STATUS_LABELS[row.status]}</span></td>
                <td>{formatDate(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
