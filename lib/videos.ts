import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/database-url";

export const VIDEO_CHUNK_SIZE = 1024 * 1024;
export const MAX_VIDEO_SIZE = 80 * 1024 * 1024;

function database() {
  const url = getDatabaseUrl();
  if (!url) throw new Error("Vercel не передал строку подключения PostgreSQL");
  return neon(url);
}

async function ensureVideoTables() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS news_videos (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    total_size INTEGER NOT NULL,
    chunk_size INTEGER NOT NULL,
    chunk_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS news_video_chunks (
    video_id TEXT NOT NULL REFERENCES news_videos(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (video_id, chunk_index)
  )`;
  return sql;
}

export async function saveVideoChunk(input: { id: string; filename: string; contentType: string; totalSize: number; chunkCount: number; index: number; data: string }) {
  const sql = await ensureVideoTables();
  await sql`INSERT INTO news_videos (id, filename, content_type, total_size, chunk_size, chunk_count)
    VALUES (${input.id}, ${input.filename}, ${input.contentType}, ${input.totalSize}, ${VIDEO_CHUNK_SIZE}, ${input.chunkCount})
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO news_video_chunks (video_id, chunk_index, data)
    VALUES (${input.id}, ${input.index}, ${input.data})
    ON CONFLICT (video_id, chunk_index) DO UPDATE SET data = EXCLUDED.data`;
}

export async function getVideo(id: string) {
  const sql = await ensureVideoTables();
  const rows = await sql`SELECT id, filename, content_type, total_size, chunk_size, chunk_count FROM news_videos WHERE id = ${id}`;
  if (!rows.length) return null;
  return {
    id: String(rows[0].id), filename: String(rows[0].filename), contentType: String(rows[0].content_type),
    totalSize: Number(rows[0].total_size), chunkSize: Number(rows[0].chunk_size), chunkCount: Number(rows[0].chunk_count),
  };
}

export async function getVideoChunks(id: string, from: number, to: number) {
  const sql = await ensureVideoTables();
  const rows = await sql`SELECT chunk_index, data FROM news_video_chunks
    WHERE video_id = ${id} AND chunk_index >= ${from} AND chunk_index <= ${to}
    ORDER BY chunk_index`;
  return rows.map((row) => Buffer.from(String(row.data), "base64"));
}

export async function deleteVideo(id: string) {
  const sql = await ensureVideoTables();
  await sql`DELETE FROM news_videos WHERE id = ${id}`;
}
