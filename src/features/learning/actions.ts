"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/features/auth/actions";
import { requireStaff, requireUser } from "@/lib/auth";
import { getEntitlements, hasCap } from "@/lib/billing";
import { sql } from "@/lib/db";
import { referenceCode } from "@/lib/format";
import { emptyToNull, examQuestionSchema, lessonSchema, splitList } from "@/lib/validators";

async function enrollment(profileId: string, programId: string) {
  const rows = await sql<{ status: string }[]>`
    select status from program_registrations
    where profile_id = ${profileId} and program_id = ${programId}
    limit 1
  `;
  return rows[0]?.status ?? null;
}

async function canLearn(profileId: string, programId: string, accountType: string) {
  if (accountType === "admin" || accountType === "super_admin") return true;
  const user = await requireUser();
  const entitlements = await getEntitlements(user);
  if (!hasCap(entitlements, "learn")) return false;
  return (await enrollment(profileId, programId)) === "confirmed";
}

async function maybeIssueCertificate(profileId: string, programId: string) {
  const entitled = await sql<{ fullName: string }[]>`
    select p.full_name
    from profiles p
    where p.id = ${profileId}
    limit 1
  `;
  const holder = entitled[0];
  if (!holder) return;

  const lessons = await sql<{ id: string }[]>`select id from lessons where program_id = ${programId}`;
  if (!lessons.length) return;
  const done = await sql<{ count: string }[]>`
    select count(*)::text as count
    from lesson_progress lp
    join lessons l on l.id = lp.lesson_id
    where lp.profile_id = ${profileId} and l.program_id = ${programId}
  `;
  if (Number(done[0]?.count ?? 0) < lessons.length) return;

  const exam = await sql<{ id: string }[]>`select id from exams where program_id = ${programId} limit 1`;
  if (exam[0]) {
    const passed = await sql<{ id: string }[]>`
      select id from exam_attempts
      where exam_id = ${exam[0].id} and profile_id = ${profileId} and passed = true
      limit 1
    `;
    if (!passed.length) return;
  }

  const program = await sql<{ title: string }[]>`select title from programs where id = ${programId} limit 1`;
  if (!program[0]) return;
  await sql`
    insert into certificates (code, program_id, profile_id, holder_name, program_title)
    values (${referenceCode().replace("SA-", "SC-")}, ${programId}, ${profileId}, ${holder.fullName}, ${program[0].title})
    on conflict (program_id, profile_id) do nothing
  `;
}

export async function completeLesson(formData: FormData) {
  const user = await requireUser();
  const lessonId = String(formData.get("lessonId") ?? "");
  const lessons = await sql<{ id: string; programId: string; slug: string }[]>`
    select l.id, l.program_id, p.slug
    from lessons l
    join programs p on p.id = l.program_id
    where l.id = ${lessonId}
    limit 1
  `;
  const lesson = lessons[0];
  if (!lesson) return;
  if (!(await canLearn(user.id, lesson.programId, user.accountType))) return;
  await sql`
    insert into lesson_progress (profile_id, lesson_id)
    values (${user.id}, ${lesson.id})
    on conflict (profile_id, lesson_id) do nothing
  `;
  await maybeIssueCertificate(user.id, lesson.programId);
  revalidatePath(`/dashboard/learning/${lesson.slug}`);
}

export async function submitExam(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const programId = String(formData.get("programId") ?? "");
  if (!(await canLearn(user.id, programId, user.accountType))) {
    return { error: "Lessons open after Selecture confirms your registration, on Select or Fellow." };
  }
  const examRows = await sql<{ id: string; passMark: number; slug: string }[]>`
    select e.id, e.pass_mark, p.slug
    from exams e
    join programs p on p.id = e.program_id
    where e.program_id = ${programId}
    limit 1
  `;
  const exam = examRows[0];
  if (!exam) return { error: "This programme has no check yet." };
  const questions = await sql<{ id: string; correctIndex: number }[]>`
    select id, correct_index from exam_questions where exam_id = ${exam.id} order by sort_order
  `;
  if (!questions.length) return { error: "This check has no questions yet." };

  let correct = 0;
  const answers = questions.map((question) => {
    const chosen = Number(formData.get(`q_${question.id}`));
    const right = chosen === question.correctIndex;
    if (right) correct += 1;
    return { questionId: question.id, chosen, right };
  });
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= exam.passMark;
  await sql`
    insert into exam_attempts (exam_id, profile_id, score, passed, answers)
    values (${exam.id}, ${user.id}, ${score}, ${passed}, ${sql.json(answers)})
  `;
  if (passed) await maybeIssueCertificate(user.id, programId);
  revalidatePath(`/dashboard/learning/${exam.slug}`);
  return {
    success: passed
      ? `Passed with ${score}%. A certificate is issued once every lesson is complete.`
      : `Score ${score}%. The pass mark is ${exam.passMark}%. You can try again.`,
  };
}

export async function addLesson(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = lessonSchema.safeParse({
    programId: formData.get("programId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    videoUrl: formData.get("videoUrl"),
    durationMinutes: formData.get("durationMinutes"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the lesson." };
  const video = emptyToNull(parsed.data.videoUrl);
  if (video && !/^https:\/\//.test(video)) return { error: "Video links need to start with https." };
  await sql`
    insert into lessons (program_id, title, summary, body, video_url, duration_minutes, sort_order)
    values (
      ${parsed.data.programId},
      ${parsed.data.title},
      ${parsed.data.summary ?? ""},
      ${parsed.data.body},
      ${video},
      ${parsed.data.durationMinutes ?? null},
      ${parsed.data.sortOrder ?? 0}
    )
  `;
  revalidatePath(`/admin/learning/${parsed.data.programId}`);
  return { success: "Lesson added." };
}

export async function addExamQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireStaff();
  const parsed = examQuestionSchema.safeParse({
    programId: formData.get("programId"),
    prompt: formData.get("prompt"),
    options: formData.get("options"),
    correctIndex: formData.get("correctIndex"),
    passMark: formData.get("passMark"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the question." };
  const options = splitList(parsed.data.options);
  if (options.length < 2) return { error: "Add at least two options, separated by commas." };
  if (parsed.data.correctIndex > options.length) return { error: "The correct option number is higher than the number of options." };

  const existing = await sql<{ id: string }[]>`select id from exams where program_id = ${parsed.data.programId} limit 1`;
  let examId = existing[0]?.id;
  if (!examId) {
    const program = await sql<{ title: string }[]>`select title from programs where id = ${parsed.data.programId} limit 1`;
    if (!program[0]) return { error: "Programme not found." };
    const created = await sql<{ id: string }[]>`
      insert into exams (program_id, title, pass_mark)
      values (${parsed.data.programId}, ${`${program[0].title} check`}, ${parsed.data.passMark ?? 70})
      returning id
    `;
    examId = created[0].id;
  } else if (parsed.data.passMark) {
    await sql`update exams set pass_mark = ${parsed.data.passMark} where id = ${examId}`;
  }

  const order = await sql<{ next: number }[]>`
    select coalesce(max(sort_order), 0) + 1 as next from exam_questions where exam_id = ${examId}
  `;
  await sql`
    insert into exam_questions (exam_id, prompt, options, correct_index, sort_order)
    values (${examId}, ${parsed.data.prompt}, ${sql.json(options)}, ${parsed.data.correctIndex - 1}, ${order[0]?.next ?? 1})
  `;
  revalidatePath(`/admin/learning/${parsed.data.programId}`);
  return { success: "Question added." };
}
