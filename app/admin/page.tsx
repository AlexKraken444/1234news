import { isAdmin } from "@/lib/auth";
import { AdminPanel } from "@/components/admin-panel";
import { getPosts } from "@/lib/posts";
import { getTickerText } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdmin();
  const [posts, tickerText] = authenticated ? await Promise.all([getPosts(), getTickerText()]) : [[], ""];
  return <AdminPanel authenticated={authenticated} initialPosts={posts} initialTickerText={tickerText} />;
}
