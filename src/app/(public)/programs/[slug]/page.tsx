import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgramRegister } from "@/components/forms/ProgramRegister";
import { PhotoShape } from "@/components/home/PhotoShape";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { sql } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rows = await sql<{ title: string; summary: string }[]>`
    select title, summary from programs where slug = ${slug} and status = 'published' limit 1
  `;
  return { title: rows[0]?.title ?? "Program", description: rows[0]?.summary };
}

export default async function ProgramDetail({ params }: Props) {
  const { slug } = await params;
  const rows = await sql<
    {
      id: string;
      title: string;
      summary: string;
      description: string;
      duration: string | null;
      format: string | null;
      audience: string | null;
      startsOn: string | null;
      imageUrl: string | null;
      imageAlt: string | null;
    }[]
  >`
    select id, title, summary, description, duration, format, audience, starts_on, image_url, image_alt
    from programs where slug = ${slug} and status = 'published' limit 1
  `;
  const program = rows[0];
  if (!program) notFound();
  const user = await getCurrentUser();

  return (
    <article className="section">
      <div className="container split-page">
        <div>
          <p className="eyebrow">Programme</p>
          {program.imageUrl && (
            <div style={{ maxWidth: "22rem", margin: "1rem 0 1.4rem" }}>
              <PhotoShape shape="arch" src={program.imageUrl} alt={program.imageAlt || program.title} />
            </div>
          )}
          <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)", margin: "0.5rem 0 1rem" }}>{program.title}</h1>
          <p className="lede">{program.summary}</p>
          <div className="prose" style={{ marginTop: "1.5rem" }}>
            {program.description.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>
        <aside className="card" style={{ alignSelf: "start", display: "grid", gap: "0.7rem" }}>
          <p><strong>Duration.</strong> {program.duration || "To be confirmed"}</p>
          <p><strong>Format.</strong> {program.format || "To be confirmed"}</p>
          <p><strong>Audience.</strong> {program.audience || "Professionals and nominated corporate participants"}</p>
          <p><strong>Start.</strong> {program.startsOn ? formatDate(program.startsOn) : "Cohort dates to be confirmed"}</p>
          {user ? (
            <>
              <ProgramRegister programId={program.id} />
              <Link href={`/dashboard/learning/${slug}`}>Open classroom</Link>
            </>
          ) : (
            <Link className="btn btn-primary" href={`/sign-in?next=/programs/${slug}`}>
              Sign in to register
            </Link>
          )}
        </aside>
      </div>
    </article>
  );
}
