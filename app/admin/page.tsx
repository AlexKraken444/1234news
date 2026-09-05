import { isAdmin } from "@/lib/auth";
import { AdminPanel } from "@/components/admin-panel";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdmin();
  const posts = authenticated ? await getPosts() : [];
  return <AdminPanel authenticated={authenticated} initialPosts={posts} />;
}
