import { notFound } from "next/navigation";
import { LessonEditor, QuestionEditor } from "@/components/learning/LearningEditor";
import { requireStaff } from "@/lib/auth";
import { sql } from "@/lib/db";

type Props = { params: Promise<{ programId: string }> };

export default async function AdminProgramLearning({ params }: Props) {
  await requireStaff();
  const { programId } = await params;
  const programs = await sql<{ id: string; title: string }[]>`select id, title from programs where id = ${programId} limit 1`;
  const program = programs[0];
  if (!program) notFound();
  const lessons = await sql<{ title: string; sortOrder: number; videoUrl: string | null }[]>`
    select title, sort_order, video_url from lessons where program_id = ${program.id} order by sort_order
  `;
  const questions = await sql<{ prompt: string }[]>`
    select q.prompt
    from exam_questions q
    join exams e on e.id = q.exam_id
    where e.program_id = ${program.id}
    order by q.sort_order
  `;
  return (
    <div>
      <p className="eyebrow">Learning</p>
      <h1 className="admin-title">{program.title}</h1>
      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <div>
          <h2>Lessons</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            {lessons.map((lesson) => (
              <li key={lesson.title}>{lesson.sortOrder}. {lesson.title}{lesson.videoUrl ? " · video" : ""}</li>
            ))}
            {lessons.length === 0 && <li>No lessons yet.</li>}
          </ul>
          <h2 style={{ marginTop: "1rem" }}>Questions</h2>
          <ul className="prose" style={{ paddingLeft: "1.1rem" }}>
            {questions.map((question) => <li key={question.prompt}>{question.prompt}</li>)}
            {questions.length === 0 && <li>No questions yet.</li>}
          </ul>
        </div>
        <div className="form-grid">
          <LessonEditor programId={program.id} />
          <QuestionEditor programId={program.id} />
        </div>
      </div>
    </div>
  );
}
