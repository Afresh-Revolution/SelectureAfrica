import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function AdminJobsPage() {
  await requireStaff();
  const jobs = await sql<{ id: string; title: string; status: string; organization: string; applicants: string }[]>`
    select j.id, j.title, j.status, o.name as organization, count(a.id)::text as applicants
    from jobs j
    join organizations o on o.id = j.organization_id
    left join applications a on a.job_id = j.id
    group by j.id, o.name
    order by j.created_at desc
  `;
  return (
    <div>
      <p className="eyebrow">Jobs</p>
      <h1 className="admin-title">Published and draft roles</h1>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Role</th><th>Organisation</th><th>Status</th><th>Applicants</th></tr></thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td><Link href={`/admin/jobs/${job.id}`}>{job.title}</Link></td>
                <td>{job.organization}</td>
                <td><span className={`badge badge-${job.status}`}>{job.status}</span></td>
                <td>{job.applicants}</td>
              </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan={4}>No roles yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
