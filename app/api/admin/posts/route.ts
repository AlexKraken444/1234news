import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { savePost } from "@/lib/posts";
import type { NewsPost } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Хранилище Vercel Blob не подключено" }, { status: 503 });
  const data = await request.formData();
  const type = data.get("type") === "video" ? "video" : "article";
  const title = String(data.get("title") || "").trim();
  const description = String(data.get("description") || "").trim();
  const videoUrl = String(data.get("videoUrl") || "");
  if (!title || title.length > 120 || !description || description.length > 3000) return NextResponse.json({ error: "Проверь заголовок и описание" }, { status: 400 });
  if (type === "video" && !videoUrl.startsWith("https://")) return NextResponse.json({ error: "Видео не загружено" }, { status: 400 });
  const base = { id: crypto.randomUUID(), type, title, description, createdAt: new Date().toISOString() };
  const post: NewsPost = type === "video" ? { ...base, type, videoUrl } : { ...base, type };
  await savePost(post);
  return NextResponse.json({ ok: true, post });
}
