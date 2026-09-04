import { list, put } from "@vercel/blob";
import type { NewsPost } from "@/lib/types";
import { getBlobCredentials } from "@/lib/blob-credentials";

const PREFIX = "1234news/posts/";

export async function getPosts(): Promise<NewsPost[]> {
  try {
    const { options } = getBlobCredentials();
    const { blobs } = await list({ prefix: PREFIX, ...options });
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
  } catch (error) {
    console.error("Could not load posts from Vercel Blob", error);
    return [];
  }
}

export async function savePost(post: NewsPost) {
  const { options } = getBlobCredentials();
  await put(`${PREFIX}${post.id}.json`, JSON.stringify(post), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    ...options,
  });
}
