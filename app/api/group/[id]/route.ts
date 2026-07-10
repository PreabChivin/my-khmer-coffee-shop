import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDiscountedPrice } from "@/lib/pricing";
import type {
  DrinkCustomization,
  GroupCartStateDTO,
} from "@/lib/types";

// 👯 Public read of a shared Bestie Cart's live state — no auth, since the
// whole point is that anyone with the link can see and join it.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const groupCart = await prisma.groupCart.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!groupCart) {
    return NextResponse.json({ error: "Bestie Cart not found" }, { status: 404 });
  }

  const body: GroupCartStateDTO = {
    id: groupCart.id,
    status: groupCart.status as "OPEN" | "CHECKED_OUT",
    orderId: groupCart.orderId,
    items: groupCart.items.map((item) => ({
      id: item.id,
      contributorName: item.contributorName,
      productId: item.productId,
      quantity: item.quantity,
      customization: (item.customizations as unknown as DrinkCustomization) ?? null,
      product: {
        nameEn: item.product.nameEn,
        nameKh: item.product.nameKh,
        // Pre-discounted so every downstream consumer (banner, sidebar,
        // checkout) shows correct totals without duplicating the discount math.
        price: computeDiscountedPrice(
          item.product.price,
          item.product.discountPercent,
          item.product.flatDiscount
        ),
        image: item.product.image,
        category: item.product.category.name,
      },
    })),
  };

  return NextResponse.json(body);
}
