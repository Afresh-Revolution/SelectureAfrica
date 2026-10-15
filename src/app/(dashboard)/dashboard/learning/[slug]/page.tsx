import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CompleteLesson, ExamForm } from "@/components/learning/LearnForms";
import { VideoFrame } from "@/components/learning/VideoFrame";
import { requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export default async function ClassroomPage({ params }: Props) {
  const user = await requireUser();
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "learn")) redirect("/dashboard/learning");
  const { slug } = await params;
  const programs = await sql<{ id: string; title: string; status: string }[]>`
    select p.id, p.title, r.status
    from programs p
    join program_registrations r on r.program_id = p.id
    where p.slug = ${slug} and r.profile_id = ${user.id}
    limit 1
  `;
  const program = programs[0];
  if (!program) notFound();
  if (program.status !== "confirmed") redirect("/dashboard/learning");

  const lessons = await sql<
    { id: string; title: string; summary: string; body: string; videoUrl: string | null; durationMinutes: number | null; done: boolean }[]
  >`
    select l.id, l.title, l.summary, l.body, l.video_url, l.duration_minutes,
      exists(select 1 from lesson_progress lp where lp.lesson_id = l.id and lp.profile_id = ${user.id}) as done
    from lessons l
    where l.program_id = ${program.id}
    order by l.sort_order, l.created_at
  `;
  const exam = await sql<{ id: string; title: string; passMark: number }[]>`
    select id, title, pass_mark from exams where program_id = ${program.id} limit 1
  `;
  const questions = exam[0]
    ? await sql<{ id: string; prompt: string; options: string[] }[]>`
        select id, prompt, options from exam_questions where exam_id = ${exam[0].id} order by sort_order
      `
    : [];
  const certificate = await sql<{ code: string }[]>`
    select code from certificates where program_id = ${program.id} and profile_id = ${user.id} limit 1
  `;

  return (
    <div>
      <p className="eyebrow">Classroom</p>
      <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", margin: "0.35rem 0 1rem" }}>{program.title}</h1>
      {certificate[0] && (
        <p className="alert alert-success">
          Certificate issued. <Link href={`/certificates/${certificate[0].code}`}>{certificate[0].code}</Link>
        </p>
      )}
      <div className="form-grid" style={{ marginTop: "1rem" }}>
        {lessons.map((lesson) => (
          <article key={lesson.id} className="card" style={{ display: "grid", gap: "0.7rem" }}>
            <h2>{lesson.title}</h2>
            {lesson.summary && <p className="muted">{lesson.summary}</p>}
            {lesson.videoUrl && <VideoFrame url={lesson.videoUrl} />}
            {lesson.body.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
            <CompleteLesson lessonId={lesson.id} done={lesson.done} />
          </article>
        ))}
        {lessons.length === 0 && <div className="empty">Lessons for this programme have not been published yet.</div>}
      </div>
      {exam[0] && questions.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>{exam[0].title}</h2>
          <ExamForm
            programId={program.id}
            passMark={exam[0].passMark}
            questions={questions.map((question) => ({
              id: question.id,
              prompt: question.prompt,
              options: Array.isArray(question.options) ? question.options : [],
            }))}
          />
        </div>
      )}
    </div>
  );
}
