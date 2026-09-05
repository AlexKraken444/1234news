import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { MAX_VIDEO_SIZE, saveVideoChunk, VIDEO_CHUNK_SIZE } from "@/lib/videos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  const id = request.headers.get("x-video-id") || "";
  const filename = decodeURIComponent(request.headers.get("x-file-name") || "video");
  const contentType = request.headers.get("x-content-type") || "video/mp4";
  const totalSize = Number(request.headers.get("x-total-size"));
  const chunkCount = Number(request.headers.get("x-chunk-count"));
  const index = Number(request.headers.get("x-chunk-index"));
  if (!/^[a-f0-9-]{36}$/i.test(id) || !Number.isInteger(index) || index < 0 || !Number.isInteger(chunkCount) || chunkCount < 1 || totalSize < 1 || totalSize > MAX_VIDEO_SIZE || !contentType.startsWith("video/")) {
    return NextResponse.json({ error: "Некорректный видеофайл" }, { status: 400 });
  }
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length || bytes.length > VIDEO_CHUNK_SIZE) return NextResponse.json({ error: "Некорректная часть файла" }, { status: 400 });
  try {
    await saveVideoChunk({ id, filename: filename.slice(0, 180), contentType, totalSize, chunkCount, index, data: bytes.toString("base64") });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not upload video chunk", error);
    return NextResponse.json({ error: "Не удалось сохранить видео в базе данных" }, { status: 503 });
  }
}
