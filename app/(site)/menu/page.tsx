import { prisma } from "@/lib/prisma";
import MenuGrid from "@/components/MenuGrid";
import MenuHeading from "@/components/MenuHeading";
import type { ProductDTO } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu | BenChimin Cafe",
};

export const dynamic = "force-dynamic";

async function getProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return products;
}

export default async function MenuPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <MenuHeading />
      <MenuGrid products={products} />
    </div>
  );
}
