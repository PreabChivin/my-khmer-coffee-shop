import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/createOrder";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toOrderHistoryItem } from "@/lib/orderHistory";
import type { CheckoutRequestBody, OrderHistoryItemDTO } from "@/lib/types";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/orders
 * The authenticated user's own order history (Bearer or cookie).
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("សូមចូលគណនីជាមុនសិន។", 401));
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        items: { include: { product: true } },
      },
    });
    const body: OrderHistoryItemDTO[] = orders.map(toOrderHistoryItem);
    return withCors(apiSuccess(body));
  } catch {
    return withCors(apiError("ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។", 503));
  }
}

/**
 * POST /api/v1/orders
 * Same body shape and logic as the web checkout (lib/createOrder.ts) — if a
 * Bearer token/cookie identifies a signed-in user, the order is linked to
 * their account exactly like a web checkout.
 */
export async function POST(request: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return withCors(apiError("ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។", 400));
  }

  const session = getUserFromRequest(request);
  const result = await createOrder(body, session);

  if (!result.ok) {
    return withCors(apiError(result.error, result.status));
  }
  return withCors(apiSuccess(result.body, 201));
}
