import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deletePost, savePost, updatePost } from "@/lib/posts";
import { deleteVideo } from "@/lib/videos";
import type { NewsPost } from "@/lib/types";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  const data = await request.formData();
  const type = data.get("type") === "video" ? "video" : "article";
  const title = String(data.get("title") || "").trim();
  const description = String(data.get("description") || "").trim();
  const videoUrl = String(data.get("videoUrl") || "");
  if (!title || title.length > 120 || !description || description.length > 3000) return NextResponse.json({ error: "Проверь заголовок и описание" }, { status: 400 });
  if (type === "video" && !(videoUrl.startsWith("https://") || videoUrl.startsWith("/api/videos/"))) return NextResponse.json({ error: "Видео не загружено" }, { status: 400 });
  const base = { id: crypto.randomUUID(), type, title, description, createdAt: new Date().toISOString() };
  const post: NewsPost = type === "video" ? { ...base, type, videoUrl } : { ...base, type };
  try {
    await savePost(post);
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    console.error("Could not save post to PostgreSQL", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка базы данных";
    return NextResponse.json({ error: `Ошибка базы данных: ${message}` }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  const data = await request.formData();
  const id = String(data.get("id") || "");
  const type = data.get("type") === "video" ? "video" : "article";
  const title = String(data.get("title") || "").trim();
  const description = String(data.get("description") || "").trim();
  const videoUrl = String(data.get("videoUrl") || "").trim();
  if (!id || !title || title.length > 120 || !description || description.length > 3000) return NextResponse.json({ error: "Проверь заголовок и описание" }, { status: 400 });
  if (type === "video" && !(videoUrl.startsWith("https://") || videoUrl.startsWith("/api/videos/"))) return NextResponse.json({ error: "Укажи корректную ссылку на видео" }, { status: 400 });
  const base = { id, type, title, description, createdAt: new Date().toISOString() };
  const post: NewsPost = type === "video" ? { ...base, type, videoUrl } : { ...base, type };
  try {
    await updatePost(post);
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    console.error("Could not update post in PostgreSQL", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка базы данных";
    return NextResponse.json({ error: `Ошибка базы данных: ${message}` }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  const id = String((await request.json()).id || "");
  if (!id) return NextResponse.json({ error: "Не указан материал" }, { status: 400 });
  try {
    const videoUrl = await deletePost(id);
    const videoId = videoUrl?.match(/^\/api\/videos\/([a-f0-9-]{36})$/i)?.[1];
    if (videoId) await deleteVideo(videoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not delete post", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка базы данных";
    return NextResponse.json({ error: `Не удалось удалить: ${message}` }, { status: 503 });
  }
}
