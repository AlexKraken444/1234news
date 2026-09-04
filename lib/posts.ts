import { list, put } from "@vercel/blob";
import type { NewsPost } from "@/lib/types";

const PREFIX = "1234news/posts/";

export async function getPosts(): Promise<NewsPost[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const { blobs } = await list({ prefix: PREFIX, token: process.env.BLOB_READ_WRITE_TOKEN });
  const posts = await Promise.all(
    blobs.map(async (blob) => {
      const response = await fetch(blob.url, { next: { revalidate: 60 } });
      if (!response.ok) return null;
      return (await response.json()) as NewsPost;
    }),
  );
  return posts
    .filter((post): post is NewsPost => post !== null)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function savePost(post: NewsPost) {
  await put(`${PREFIX}${post.id}.json`, JSON.stringify(post), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}
