import Link from "next/link";
import { InsightForm } from "@/components/admin/ContentForms";
import { sql } from "@/lib/db";

export default async function InsightsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const articles = await sql<
    { id: string; title: string; slug: string; excerpt: string; body: string; category: string; published: boolean; authorName: string }[]
  >`select id, title, slug, excerpt, body, category, published, author_name from insights order by updated_at desc`;
  const current = articles.find((article) => article.id === edit);
  return (
    <div className="split-page">
      <div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "1rem" }}>Insights</h1>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Title</th><th>State</th><th></th></tr></thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>{article.published ? "Published" : "Draft"}</td>
                  <td><Link href={`/admin/insights?edit=${article.id}`}>Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <InsightForm key={current?.id ?? "new"} article={current} />
    </div>
  );
}
