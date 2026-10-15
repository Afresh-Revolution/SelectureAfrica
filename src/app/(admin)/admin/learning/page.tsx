import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function AdminLearningPage() {
  await requireStaff();
  const programs = await sql<{ id: string; title: string; lessons: string; questions: string }[]>`
    select p.id, p.title,
      (select count(*) from lessons l where l.program_id = p.id)::text as lessons,
      (select count(*) from exam_questions q join exams e on e.id = q.exam_id where e.program_id = p.id)::text as questions
    from programs p
    order by p.sort_order, p.title
  `;
  return (
    <div>
      <p className="eyebrow">Learning</p>
      <h1 className="admin-title">Lessons and checks</h1>
      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data">
          <thead><tr><th>Programme</th><th>Lessons</th><th>Questions</th></tr></thead>
          <tbody>
            {programs.map((program) => (
              <tr key={program.id}>
                <td><Link href={`/admin/learning/${program.id}`}>{program.title}</Link></td>
                <td>{program.lessons}</td>
                <td>{program.questions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
