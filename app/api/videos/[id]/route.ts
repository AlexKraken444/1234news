import { getVideo, getVideoChunks } from "@/lib/videos";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return new Response("Видео не найдено", { status: 404 });

  const requested = request.headers.get("range")?.match(/bytes=(\d+)-(\d*)/);
  const start = requested ? Number(requested[1]) : 0;
  if (!Number.isFinite(start) || start < 0 || start >= video.totalSize) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${video.totalSize}` } });
  const endRequested = requested?.[2] ? Number(requested[2]) : start + video.chunkSize - 1;
  const end = Math.min(endRequested, start + video.chunkSize - 1, video.totalSize - 1);
  const firstChunk = Math.floor(start / video.chunkSize);
  const lastChunk = Math.floor(end / video.chunkSize);
  const chunks = await getVideoChunks(id, firstChunk, lastChunk);
  if (!chunks.length) return new Response("Видео ещё загружается", { status: 404 });
  const joined = Buffer.concat(chunks);
  const offset = start - firstChunk * video.chunkSize;
  const body = joined.subarray(offset, offset + (end - start + 1));
  return new Response(body, {
    status: 206,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Type": video.contentType,
      "Content-Length": String(body.length),
      "Content-Range": `bytes ${start}-${end}/${video.totalSize}`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
