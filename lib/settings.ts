import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/database-url";

export const DEFAULT_TICKER_TEXT = "КЛАССНЫЕ НОВОСТИ • БЕЗ СПЛЕТЕН • ПОЧТИ";

function database() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("Vercel не передал строку подключения PostgreSQL");
  return neon(url);
}

async function ensureSettingsTable() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS news_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

export async function getTickerText() {
  try {
    const sql = await ensureSettingsTable();
    const rows = await sql`SELECT value FROM news_settings WHERE key = 'ticker_text'`;
    return rows.length ? String(rows[0].value) : DEFAULT_TICKER_TEXT;
  } catch (error) {
    console.error("Could not load ticker text", error);
    return DEFAULT_TICKER_TEXT;
  }
}

export async function saveTickerText(value: string) {
  const sql = await ensureSettingsTable();
  await sql`INSERT INTO news_settings (key, value, updated_at)
    VALUES ('ticker_text', ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
}
