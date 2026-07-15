import { prisma } from "@/lib/prisma";
import type { CategoryDTO } from "@/lib/types";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/categories
 * Public.
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } },
    });
    const body: CategoryDTO[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      iconKey: c.iconKey,
      iconUrl: c.iconUrl,
      productCount: c._count.products,
    }));
    return withCors(apiSuccess(body));
  } catch {
    return withCors(apiError("ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។", 503));
  }
}
