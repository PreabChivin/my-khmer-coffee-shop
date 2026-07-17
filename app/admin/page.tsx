import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import AdminDashboard from "@/components/admin/AdminDashboard";
import type { ProductDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { createdAt: "asc" }],
  });
  return products.map(({ category, ...p }) => ({
    ...p,
    category: category.name,
  }));
}

// 🔐 Top-level route — deliberately OUTSIDE the (site) group, so it never
// inherits the customer Header/Footer/Cart chrome (strict world separation,
// same intent as the old inline Staff Kitchen View). Gated server-side: a
// logged-out visitor or a CUSTOMER-role session is bounced to /login before
// any staff data is ever fetched.
export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  const products = await getAllProducts();

  return (
    <AdminDashboard
      initialProducts={products}
      isAdminRole={session.role === "ADMIN"}
    />
  );
}
