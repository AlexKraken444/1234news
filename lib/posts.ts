import { neon } from "@neondatabase/serverless";
import type { NewsPost } from "@/lib/types";

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не подключена");
  return neon(url);
}

async function ensureTable() {
  const sql = database();
  await sql`CREATE TABLE IF NOT EXISTS news_posts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('article', 'video')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

export async function getPosts(): Promise<NewsPost[]> {
  try {
    const sql = await ensureTable();
    const rows = await sql`SELECT id, type, title, description, video_url, created_at FROM news_posts ORDER BY created_at DESC`;
    return rows.map((row) => row.type === "video" ? {
      id: String(row.id), type: "video", title: String(row.title), description: String(row.description),
      videoUrl: String(row.video_url), createdAt: new Date(String(row.created_at)).toISOString(),
    } : {
      id: String(row.id), type: "article", title: String(row.title), description: String(row.description),
      createdAt: new Date(String(row.created_at)).toISOString(),
    });
  } catch (error) {
    console.error("Could not load posts from PostgreSQL", error);
    return [];
  }
}

export async function savePost(post: NewsPost) {
  const sql = await ensureTable();
  const videoUrl = post.type === "video" ? post.videoUrl : null;
  await sql`INSERT INTO news_posts (id, type, title, description, video_url, created_at)
    VALUES (${post.id}, ${post.type}, ${post.title}, ${post.description}, ${videoUrl}, ${post.createdAt})`;
}
