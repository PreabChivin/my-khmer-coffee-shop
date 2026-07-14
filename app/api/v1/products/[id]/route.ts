import { prisma } from "@/lib/prisma";
import type { ProductDTO } from "@/lib/types";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/products/[id]
 * Public.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      return withCors(apiError("Product not found.", 404));
    }
    const { category, ...p } = product;
    const body: ProductDTO = { ...p, category: category.name };
    return withCors(apiSuccess(body));
  } catch {
    return withCors(apiError("The database is busy — please try again in a moment.", 503));
  }
}
