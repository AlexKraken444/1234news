import { getPosts } from "@/lib/posts";
import { HomePage } from "@/components/home-page";
import { getTickerText } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [posts, tickerText] = await Promise.all([getPosts(), getTickerText()]);
  return <HomePage posts={posts} tickerText={tickerText} />;
}
