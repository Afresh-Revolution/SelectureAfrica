import { sql } from "@/lib/db";

export async function publishedPrograms() {
  return sql<
    {
      id: string;
      slug: string;
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
    select id, slug, title, summary, description, duration, format, audience, starts_on, image_url, image_alt
    from programs
    where status = 'published'
    order by sort_order, title
  `;
}

export async function publishedInsights() {
  return sql<
    {
      id: string;
      slug: string;
      title: string;
      excerpt: string;
      body: string;
      category: string;
      publishedAt: string | null;
      authorName: string;
    }[]
  >`
    select id, slug, title, excerpt, body, category, published_at, author_name
    from insights
    where published = true
    order by published_at desc nulls last
  `;
}
