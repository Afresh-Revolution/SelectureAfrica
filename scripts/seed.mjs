import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const text = readFileSync(join(root, ".env"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
const email = (process.env.ADMIN_EMAIL || "admin@selectureafrica.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 10) {
  throw new Error("Set ADMIN_PASSWORD in .env before seeding.");
}

const passwordHash = await bcrypt.hash(password, 12);
const existing = await sql`select id from profiles where email = ${email}`;
if (!existing.length) {
  const created = await sql`
    insert into profiles (email, password_hash, full_name, account_type, email_verified_at)
    values (${email}, ${passwordHash}, 'Selecture Administrator', 'super_admin', now())
    returning id
  `;
  await sql`
    insert into notification_preferences (profile_id, newsletter, product_updates, request_alerts)
    values (${created[0].id}, false, true, true)
  `;
  console.log("super admin created");
} else {
  console.log("super admin already exists");
}

const programs = [
  {
    slug: "market-education",
    title: "Market Education",
    summary: "How commercial markets actually work, and how professionals read them before they enter.",
    description:
      "Market Education introduces the commercial context around a role: who buys, who influences the decision, and how a business makes money in its sector.\n\nThe course is designed as preparation, not as a substitute for a degree. Cohort dates, trainers and delivery format are confirmed before a group begins.\n\nParticipants leave with a clearer way to talk about a market in an interview and in the first months of a job.",
    duration: "Short course",
    format: "Cohort, format confirmed per intake",
    audience: "Early and mid-career professionals",
    sort: 1,
  },
  {
    slug: "understanding-capital",
    title: "Understanding Capital",
    summary: "How capital is raised, priced and used — without pretending a classroom replaces a treasury.",
    description:
      "Understanding Capital explains how funding moves through a business: equity, debt, working capital and the questions investors and lenders actually ask.\n\nIt is written for professionals who need fluency, not for people raising a fund. The final teaching plan is confirmed with the delivery team before publication of a cohort.",
    duration: "Short course",
    format: "Cohort, format confirmed per intake",
    audience: "Professionals moving into commercial or leadership roles",
    sort: 2,
  },
  {
    slug: "supply-chains",
    title: "Supply Chains & Distribution",
    summary: "How products move, where value is added, and what breaks when the chain is treated as an afterthought.",
    description:
      "This course follows a product from source to customer: access, sales, distribution and the operational decisions in between.\n\nIt is practical preparation for roles in FMCG, operations and commercial teams. Exact sessions are set when a cohort is opened.",
    duration: "Short course",
    format: "Cohort, format confirmed per intake",
    audience: "Operators, commercial staff and career-switchers",
    sort: 3,
  },
  {
    slug: "workforce-readiness",
    title: "Workforce Readiness",
    summary: "A working title for the fourth course, covering professional conduct, selection and the first months in role.",
    description:
      "The fourth course in the planned programme was not given a final title in the original brief. Workforce Readiness is the working name used on the site until stakeholders confirm the curriculum.\n\nThe intention is employability: how professionals present themselves, how selection works, and how to enter a role without losing the first ninety days.\n\nSelecture staff can rename and rewrite this course from the admin panel.",
    duration: "Short course",
    format: "Cohort, format confirmed per intake",
    audience: "Professionals preparing for placement",
    sort: 4,
  },
];

for (const program of programs) {
  await sql`
    insert into programs (slug, title, summary, description, duration, format, audience, status, sort_order)
    values (${program.slug}, ${program.title}, ${program.summary}, ${program.description}, ${program.duration}, ${program.format}, ${program.audience}, 'published', ${program.sort})
    on conflict (slug) do nothing
  `;
}

const articles = [
  {
    slug: "search-is-not-a-portal",
    title: "A search is not a portal",
    excerpt: "Why Selecture keeps candidate research with consultants, even as the firm opens a digital front door.",
    category: "Practice",
    body:
      "A website can take an instruction cleanly. It cannot decide who is right for a culture.\n\nSelecture’s executive search still begins with business principals, moves through research and qualification, and ends when a contract is closed. The digital account exists so a client can see that the work is moving, not so the firm can publish a board of vacancies and step away.\n\nThat distinction matters. Organisations come to Selecture for judgement. Professionals come to be known properly. Neither of those is improved by turning private CVs into a public catalogue.",
  },
  {
    slug: "diaspora-and-the-local-market",
    title: "Diaspora talent and the market in front of you",
    excerpt: "Global networks are useful when they are matched to a local requirement, not waved as a slogan.",
    category: "Markets",
    body:
      "Selecture’s reach includes Africans in the diaspora and professionals already working in African markets. The useful question is not which pool is larger. It is which person can do this job, in this organisation, now.\n\nIntercultural skill is part of that judgement. Many of the firm’s clients operate across borders even when the seat is in one city. A shortlist that ignores either the local market or the diaspora is usually an incomplete one.\n\nThe website lets both employers and professionals say where they are. The consultant still decides who is introduced.",
  },
  {
    slug: "what-preparation-changes",
    title: "What preparation changes",
    excerpt: "Training does not replace recruitment. It changes the quality of the introduction.",
    category: "Programmes",
    body:
      "The planned programme is four courses: markets, capital, supply chains, and a fourth curriculum whose final title is still to be confirmed. The point of the set is employability.\n\nSelecture is not opening a university. There are no examinations, certificates or streamed classrooms in this release. There is a catalogue, a way to register interest, and a staff desk that can confirm or waitlist a participant.\n\nPreparation is valuable when it is honest about that boundary. A person who understands how a market and a supply chain work is easier to place well. The placement itself remains a professional mandate.",
  },
];

for (const article of articles) {
  await sql`
    insert into insights (slug, title, excerpt, body, category, published, published_at, author_name)
    values (${article.slug}, ${article.title}, ${article.excerpt}, ${article.body}, ${article.category}, true, now(), 'Selecture Africa')
    on conflict (slug) do nothing
  `;
}

await sql.end();
console.log("seed complete");
