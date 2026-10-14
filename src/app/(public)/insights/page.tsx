import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { publishedInsights } from "@/lib/queries";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const articles = await publishedInsights();
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Insights & resources</p>
        <h1 style={{ fontSize: "clamp(2.8rem, 5vw, 4.4rem)", maxWidth: "12ch", margin: "0.5rem 0 1.5rem" }}>
          Practice notes, not a content mill.
        </h1>
        <div className="grid-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/insights/${article.slug}`} className="card" style={{ textDecoration: "none" }}>
              <span className="badge">{article.category}</span>
              <h2 style={{ fontSize: "1.8rem", margin: "0.8rem 0 0.4rem" }}>{article.title}</h2>
              <p className="muted">{article.excerpt}</p>
              <p style={{ marginTop: "1rem" }}>{formatDate(article.publishedAt)}</p>
            </Link>
          ))}
        </div>
        {articles.length === 0 && <div className="empty">Articles will be published here.</div>}
      </div>
    </section>
  );
}
