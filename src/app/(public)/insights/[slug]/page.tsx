import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/format";
import { sql } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const rows = await sql<{ title: string; excerpt: string }[]>`
    select title, excerpt from insights where slug = ${slug} and published = true limit 1
  `;
  return { title: rows[0]?.title ?? "Insight", description: rows[0]?.excerpt };
}

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const rows = await sql<
    { title: string; body: string; category: string; publishedAt: string | null; authorName: string }[]
  >`
    select title, body, category, published_at, author_name
    from insights where slug = ${slug} and published = true limit 1
  `;
  const article = rows[0];
  if (!article) notFound();
  return (
    <article className="section">
      <div className="container-narrow">
        <p className="eyebrow">{article.category}</p>
        <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", margin: "0.6rem 0 0.8rem" }}>{article.title}</h1>
        <p className="muted">
          {article.authorName} · {formatDate(article.publishedAt)}
        </p>
        <div className="prose" style={{ marginTop: "1.8rem" }}>
          {article.body.split("\n").filter(Boolean).map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
