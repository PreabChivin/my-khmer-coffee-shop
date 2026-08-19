import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

// 🔐 Top-level route — deliberately OUTSIDE the (site) group, so it never
// inherits the player Header/Footer chrome (strict world separation, same
// intent as the old inline Staff Kitchen View). Gated server-side: a
// logged-out visitor or a CUSTOMER-role session is bounced to /login before
// any staff data is ever fetched.
export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  return <AdminDashboard isAdminRole={session.role === "ADMIN"} />;
}
