import { prisma } from "@/lib/prisma";
import HomeContent from "@/components/home/HomeContent";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

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

async function getAllCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    iconKey: c.iconKey,
    iconUrl: c.iconUrl,
  }));
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return <HomeContent initialProducts={products} initialCategories={categories} />;
}
