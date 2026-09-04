import { getPosts } from "@/lib/posts";
import { HomePage } from "@/components/home-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const posts = await getPosts();
  return <HomePage posts={posts} />;
}
