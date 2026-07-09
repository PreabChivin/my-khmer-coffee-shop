import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RateRequestBody {
  orderId?: string;
  rating?: number;
}

// ⭐ Dynamic Customer Rating Calculator. One rating per COMPLETED order, fanned
// out across every distinct product in that order. Fully atomic: the
// "claim" update (customerRating: null -> rating) only succeeds for exactly
// one concurrent request, so a refresh/double-submit can never double-count.
export async function POST(request: NextRequest) {
  let body: RateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId, rating } = body;

  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return NextResponse.json(
      { error: "rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.orderStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "Only completed orders can be rated" },
      { status: 400 }
    );
  }
  if (order.customerRating !== null) {
    // Already rated — idempotent no-op rather than an error, so a refreshed
    // success screen doesn't show a scary failure state.
    return NextResponse.json({ success: true, alreadyRated: true });
  }

  const uniqueProductIds = [...new Set(order.items.map((item) => item.productId))];

  const claimed = await prisma.$transaction(async (tx) => {
    // Atomic claim: only the first concurrent request can flip this from
    // null, so the product aggregate below is incremented exactly once.
    const claim = await tx.order.updateMany({
      where: { id: orderId, customerRating: null, orderStatus: "COMPLETED" },
      data: { customerRating: rating },
    });
    if (claim.count === 0) return false;

    if (uniqueProductIds.length > 0) {
      await tx.product.updateMany({
        where: { id: { in: uniqueProductIds } },
        data: {
          ratingCount: { increment: 1 },
          ratingSum: { increment: rating },
        },
      });
    }
    return true;
  });

  return NextResponse.json({ success: true, alreadyRated: !claimed });
}
