import Link from "next/link";
import { ProgramForm } from "@/components/admin/ContentForms";
import { sql } from "@/lib/db";

export default async function ProgramsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const programs = await sql<
    {
      id: string;
      title: string;
      slug: string;
      summary: string;
      description: string;
      duration: string | null;
      format: string | null;
      audience: string | null;
      status: string;
      startsOn: string | null;
      sortOrder: number;
      imageUrl: string | null;
      imageAlt: string | null;
    }[]
  >`select id, title, slug, summary, description, duration, format, audience, status, starts_on, sort_order, image_url, image_alt from programs order by sort_order, title`;
  const current = programs.find((program) => program.id === edit);
  return (
    <div>
      <div className="admin-heading">
        <h1>Programmes</h1>
      </div>
      <div className="admin-desk">
        <div className="admin-list">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Title</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {programs.map((program) => (
                  <tr key={program.id}>
                    <td>{program.title}</td>
                    <td>{program.status}</td>
                    <td><Link href={`/admin/programs?edit=${program.id}`}>Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ProgramForm key={current?.id ?? "new"} program={current} />
      </div>
    </div>
  );
}
