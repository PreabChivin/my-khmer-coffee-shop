import { prisma } from "@/lib/prisma";
import HomeContent from "@/components/HomeContent";
import type { ProductDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getAllProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return products;
}

export default async function HomePage() {
  const products = await getAllProducts();

  return <HomeContent initialProducts={products} />;
}
