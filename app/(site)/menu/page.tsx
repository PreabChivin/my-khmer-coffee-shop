import { prisma } from "@/lib/prisma";
import MenuGrid from "@/components/MenuGrid";
import MenuHeading from "@/components/MenuHeading";
import GroupCartBanner from "@/components/GroupCartBanner";
import StartGroupCartButton from "@/components/StartGroupCartButton";
import type { ProductDTO } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu | BenChimin Cafe",
};

export const dynamic = "force-dynamic";

async function getProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { createdAt: "asc" }],
  });
  return products.map(({ category, ...p }) => ({
    ...p,
    category: category.name,
  }));
}

export default async function MenuPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <MenuHeading />
      <StartGroupCartButton />
      <GroupCartBanner />
      <MenuGrid products={products} />
    </div>
  );
}
