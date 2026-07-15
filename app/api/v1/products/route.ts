import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ProductDTO } from "@/lib/types";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/products
 * Public. Optional `?category=<categoryId>` filter.
 */
export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("category");

  try {
    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { createdAt: "asc" }],
    });
    const body: ProductDTO[] = products.map(({ category, ...p }) => ({
      ...p,
      category: category.name,
    }));
    return withCors(apiSuccess(body));
  } catch {
    return withCors(apiError("ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។", 503));
  }
}
