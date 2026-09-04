import { isAdmin } from "@/lib/auth";
import { AdminPanel } from "@/components/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  return <AdminPanel authenticated={await isAdmin()} />;
}
