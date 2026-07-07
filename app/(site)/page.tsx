import { prisma } from "@/lib/prisma";
import HomeContent from "@/components/HomeContent";
import type { ProductDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getFeaturedProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "asc" },
    take: 4,
  });
  return products;
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return <HomeContent featuredProducts={featuredProducts} />;
}
