import { getPosts } from "@/lib/posts";
import { HomePage } from "@/components/home-page";
import { getTickerText } from "@/lib/settings";
import { getComments, getCurrentUser } from "@/lib/community";

export const dynamic = "force-dynamic";

export default async function Page() {
  const posts = await getPosts();
  const [tickerText, comments, currentUser] = await Promise.all([getTickerText(), getComments(), getCurrentUser()]);
  return <HomePage posts={posts} tickerText={tickerText} initialComments={comments} currentUser={currentUser} />;
}
