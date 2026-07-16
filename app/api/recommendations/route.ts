import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { ProductDTO, RecommendationDTO } from "@/lib/types";

const MAX_RECOMMENDATIONS = 3;
// Cold-start window when a member has no order history yet.
const POPULAR_LOOKBACK_DAYS = 30;

function toProductDTO(product: {
  id: string;
  nameEn: string;
  nameKh: string;
  descriptionEn: string | null;
  descriptionKh: string | null;
  price: number;
  categoryId: string;
  category: { name: string };
  image: string;
  isAvailable: boolean;
  isPartner: boolean;
  partnerName: string | null;
  discountPercent: number;
  flatDiscount: number;
  promoTag: string | null;
  ratingCount: number;
  ratingSum: number;
}): ProductDTO {
  return {
    id: product.id,
    nameEn: product.nameEn,
    nameKh: product.nameKh,
    descriptionEn: product.descriptionEn,
    descriptionKh: product.descriptionKh,
    price: product.price,
    category: product.category.name,
    categoryId: product.categoryId,
    image: product.image,
    isAvailable: product.isAvailable,
    isPartner: product.isPartner,
    partnerName: product.partnerName,
    discountPercent: product.discountPercent,
    flatDiscount: product.flatDiscount,
    promoTag: product.promoTag,
    ratingCount: product.ratingCount,
    ratingSum: product.ratingSum,
  };
}

/**
 * GET /api/recommendations
 * ✨ "Recommended for you" on the account page — a heuristic over the
 * member's own order history, computed on every request (no stored model,
 * no training, no Python service):
 *   1. Sum quantity per product they've ordered before → their most-ordered
 *      still-available product becomes the "your usual" pick.
 *   2. Their most-ordered CATEGORY, minus products they've already had →
 *      up to 2 more picks labeled "popular in a category you like".
 *   3. Cold start (no order history yet): the site's overall best-sellers in
 *      the last 30 days, so a brand-new member still sees something relevant.
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { userId: session.id, orderStatus: { not: "CANCELLED" } } },
      select: { productId: true, quantity: true },
    });

    const recommendations: RecommendationDTO[] = [];
    const excludeIds = new Set<string>();

    if (orderItems.length > 0) {
      const qtyByProduct = new Map<string, number>();
      for (const item of orderItems) {
        qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
      }
      const orderedProductIds = [...qtyByProduct.keys()];
      const orderedProducts = await prisma.product.findMany({
        where: { id: { in: orderedProductIds } },
        include: { category: true },
      });
      const productById = new Map(orderedProducts.map((p) => [p.id, p]));

      // 1. Their most-ordered, still-available product = "your usual".
      const rankedByQty = [...qtyByProduct.entries()].sort((a, b) => b[1] - a[1]);
      const usual = rankedByQty
        .map(([id]) => productById.get(id))
        .find((p) => p?.isAvailable);
      if (usual) {
        recommendations.push({ product: toProductDTO(usual), reason: "your-usual" });
        excludeIds.add(usual.id);
      }

      // 2. Most-ordered category, quantity-weighted, excluding what they've had.
      const qtyByCategory = new Map<string, number>();
      for (const [productId, qty] of qtyByProduct) {
        const categoryId = productById.get(productId)?.categoryId;
        if (!categoryId) continue;
        qtyByCategory.set(categoryId, (qtyByCategory.get(categoryId) ?? 0) + qty);
      }
      const topCategoryId = [...qtyByCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topCategoryId) {
        const categoryPicks = await prisma.product.findMany({
          where: {
            categoryId: topCategoryId,
            isAvailable: true,
            id: { notIn: [...excludeIds, ...orderedProductIds] },
          },
          include: { category: true },
          orderBy: { ratingSum: "desc" },
          take: MAX_RECOMMENDATIONS - recommendations.length,
        });
        for (const p of categoryPicks) {
          recommendations.push({ product: toProductDTO(p), reason: "popular-in-category" });
          excludeIds.add(p.id);
        }
      }
    }

    // 3. Cold start / fill remaining slots — overall recent best-sellers.
    if (recommendations.length < MAX_RECOMMENDATIONS) {
      const since = new Date(Date.now() - POPULAR_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
      const popularItems = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { createdAt: { gte: since }, orderStatus: { not: "CANCELLED" } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: MAX_RECOMMENDATIONS + excludeIds.size,
      });
      const candidateIds = popularItems
        .map((p) => p.productId)
        .filter((id) => !excludeIds.has(id));
      if (candidateIds.length > 0) {
        const popularProducts = await prisma.product.findMany({
          where: { id: { in: candidateIds }, isAvailable: true },
          include: { category: true },
        });
        const byId = new Map(popularProducts.map((p) => [p.id, p]));
        for (const id of candidateIds) {
          if (recommendations.length >= MAX_RECOMMENDATIONS) break;
          const p = byId.get(id);
          if (!p) continue;
          recommendations.push({ product: toProductDTO(p), reason: "popular-overall" });
          excludeIds.add(p.id);
        }
      }
    }

    return NextResponse.json(recommendations);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
