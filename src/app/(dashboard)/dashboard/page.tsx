import Link from "next/link";
import { SubmissionActions } from "@/components/dashboard/SubmissionActions";
import {
  deleteServiceRequest,
  deleteProgramRegistration,
} from "@/features/membership/actions";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { REGISTRATION_LABELS, STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { ServiceRequestStatus } from "@/types";

export default async function DashboardHome() {
  const user = await requireUser();
  const notes = await sql<
    { id: string; title: string; body: string; createdAt: string }[]
  >`
    select id, title, body, created_at from notifications
    where profile_id = ${user.id}
    order by created_at desc
    limit 5
  `;

  if (user.accountType === "corporate" && user.organizationId) {
    const counts = await sql<{ status: ServiceRequestStatus; count: string }[]>`
      select status, count(*)::text as count
      from service_requests
      where organization_id = ${user.organizationId}
      group by status
    `;
    const open = counts
      .filter((row) => !["completed", "closed"].includes(row.status))
      .reduce((sum, row) => sum + Number(row.count), 0);
    const recent = await sql<
      {
        id: string;
        referenceCode: string;
        title: string;
        status: ServiceRequestStatus;
        createdAt: string;
        submittedBy: string;
      }[]
    >`
      select id, reference_code, title, status, created_at, submitted_by
      from service_requests
      where organization_id = ${user.organizationId}
      order by created_at desc
      limit 5
    `;
    return (
      <div className="member-overview">
        <header className="member-overview-head">
          <p className="eyebrow">Corporate account</p>
          <h1 id="account-title">{user.organizationName}</h1>
          <p className="member-overview-summary">
            Requests are reviewed by Selecture staff. Roles, payroll and
            analytics sit alongside them, and open with the matching membership.
          </p>
        </header>
        <section
          className="member-overview-metrics"
          aria-label="Request summary"
        >
          <article className="member-metric">
            <p className="member-metric-label">Open requests</p>
            <p className="member-metric-value">{open}</p>
          </article>
          <article className="member-metric member-metric-accent">
            <p className="member-metric-label">All requests</p>
            <p className="member-metric-value">
              {counts.reduce((sum, row) => sum + Number(row.count), 0)}
            </p>
          </article>
        </section>
        <section
          className="member-overview-section"
          aria-labelledby="recent-requests-title"
        >
          <div className="member-section-head">
            <div>
              <p className="eyebrow">Activity</p>
              <h2 id="recent-requests-title">Recent requests</h2>
            </div>
            <Link className="btn btn-line" href="/dashboard/requests">
              View all requests
            </Link>
          </div>
          <RequestTable rows={recent} currentUserId={user.id} />
        </section>
        <Notes notes={notes} />
      </div>
    );
  }

  const registrations = await sql<
    { id: string; title: string; status: keyof typeof REGISTRATION_LABELS }[]
  >`
    select r.id, p.title, r.status
    from program_registrations r
    join programs p on p.id = r.program_id
    where r.profile_id = ${user.id}
    order by r.created_at desc
    limit 5
  `;
  return (
    <div className="member-overview">
      <header className="member-overview-head">
        <p className="eyebrow">Professional account</p>
        <h1>{user.fullName}</h1>
        <p className="member-overview-summary">
          Your profile and CV stay private until you apply for a role. Matches,
          lessons and assessments are in the account menu.
        </p>
        <div className="member-overview-actions">
          <Link className="btn btn-primary" href="/dashboard/profile">
            Complete profile
          </Link>
          <Link className="btn btn-line" href="/dashboard/jobs">
            See matches
          </Link>
          <Link className="btn btn-line" href="/programs">
            Browse programmes
          </Link>
        </div>
      </header>
      <section
        className="member-overview-metrics"
        aria-label="Programme summary"
      >
        <article className="member-metric">
          <p className="member-metric-label">Confirmed programmes</p>
          <p className="member-metric-value">
            {registrations.filter((item) => item.status === "confirmed").length}
          </p>
        </article>
        <article className="member-metric member-metric-accent">
          <p className="member-metric-label">Total registrations</p>
          <p className="member-metric-value">{registrations.length}</p>
        </article>
      </section>
      <section
        className="member-overview-section"
        aria-labelledby="programme-registrations-title"
      >
        <div className="member-section-head">
          <div>
            <p className="eyebrow">Learning</p>
            <h2 id="programme-registrations-title">Programme registrations</h2>
          </div>
          <Link className="btn btn-line" href="/programs">
            Explore programmes
          </Link>
        </div>
        {registrations.length === 0 ? (
          <div className="empty">
            No registrations yet. Browse the catalogue to find a programme.
          </div>
        ) : (
          <ul className="member-registration-list">
            {registrations.map((item) => (
              <li key={item.title}>
                <div className="member-registration-entry">
                  <strong>{item.title}</strong>
                  <span className={`badge badge-${item.status}`}>
                    {REGISTRATION_LABELS[item.status]}
                  </span>
                </div>
                <SubmissionActions
                  recordId={item.id}
                  idField="registrationId"
                  editHref={`/dashboard/submissions/${item.id}/edit`}
                  deleteAction={deleteProgramRegistration}
                  itemLabel="programme registration"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <Notes notes={notes} />
    </div>
  );
}

function RequestTable({
  rows,
  currentUserId,
}: {
  rows: {
    id: string;
    referenceCode: string;
    title: string;
    status: ServiceRequestStatus;
    createdAt: string;
    submittedBy: string;
  }[];
  currentUserId: string;
}) {
  if (!rows.length) return <div className="empty">No requests yet.</div>;
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Request</th>
            <th>Status</th>
            <th>Date</th>
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
              <td>
                <span className={`badge badge-${row.status}`}>
                  {STATUS_LABELS[row.status]}
                </span>
              </td>
              <td>{formatDate(row.createdAt)}</td>
              <td>
                {row.submittedBy === currentUserId && (
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
  );
}

function Notes({
  notes,
}: {
  notes: { id: string; title: string; body: string; createdAt: string }[];
}) {
  if (!notes.length) return null;
  return (
    <div className="member-overview-section member-overview-messages">
      <h2>Messages</h2>
      <div className="form-grid" style={{ marginTop: "0.8rem" }}>
        {notes.map((note) => (
          <article key={note.id} className="card">
            <strong>{note.title}</strong>
            <p className="muted">{note.body}</p>
            <p>{formatDate(note.createdAt)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
