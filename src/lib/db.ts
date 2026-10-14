import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const globalForSql = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

export const sql =
  globalForSql.sql ??
  postgres(connectionString, {
    ssl: "require",
    max: 8,
    idle_timeout: 20,
    connect_timeout: 15,
    transform: postgres.camel,
  });

if (process.env.NODE_ENV !== "production") {
  globalForSql.sql = sql;
}
