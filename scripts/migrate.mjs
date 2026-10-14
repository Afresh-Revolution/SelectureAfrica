import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

await sql`
  create table if not exists schema_migrations (
    id text primary key,
    applied_at timestamptz not null default now()
  )
`;

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  const applied = await sql`select id from schema_migrations where id = ${file}`;
  if (applied.length) {
    console.log("skip", file);
    continue;
  }
  const body = readFileSync(join(dir, file), "utf8");
  await sql.unsafe(body);
  await sql`insert into schema_migrations (id) values (${file}) on conflict (id) do nothing`;
  console.log("applied", file);
}

await sql.end();
console.log("migrations complete");
