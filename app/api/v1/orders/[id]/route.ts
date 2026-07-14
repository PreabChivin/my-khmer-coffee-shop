import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toOrderHistoryItem } from "@/lib/orderHistory";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/orders/[id]
 * Single order detail, scoped to the authenticated user — returns 404 (not
 * 403) for orders that exist but belong to someone else, so this endpoint
 * never confirms/denies another account's order IDs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("Please sign in first.", 401));
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        items: { include: { product: true } },
      },
    });
    if (!order || order.userId !== session.id) {
      return withCors(apiError("Order not found.", 404));
    }
    return withCors(apiSuccess(toOrderHistoryItem(order)));
  } catch {
    return withCors(apiError("The database is busy — please try again in a moment.", 503));
  }
}
