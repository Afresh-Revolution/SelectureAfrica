import type { MetadataRoute } from "next";
import { publishedInsights, publishedPrograms } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticRoutes = ["", "/about", "/services", "/industries", "/employers", "/professionals", "/programs", "/insights", "/contact", "/privacy"].map(
    (path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }),
  );
  const [programs, insights] = await Promise.all([publishedPrograms(), publishedInsights()]);
  return [
    ...staticRoutes,
    ...programs.map((program) => ({ url: `${base}/programs/${program.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...insights.map((article) => ({ url: `${base}/insights/${article.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
