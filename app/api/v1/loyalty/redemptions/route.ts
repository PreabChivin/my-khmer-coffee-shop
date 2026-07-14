import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { RedemptionDTO } from "@/lib/types";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/loyalty/redemptions
 * The authenticated user's own redemption history.
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("Please sign in first.", 401));
  }
  try {
    const rows = await prisma.redemptionHistory.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    const body: RedemptionDTO[] = rows.map((r) => ({
      id: r.id,
      rewardName: r.rewardName,
      rewardEmoji: r.rewardEmoji,
      cost: r.cost,
      status: r.status as "PENDING" | "FULFILLED",
      createdAt: r.createdAt.toISOString(),
    }));
    return withCors(apiSuccess(body));
  } catch {
    return withCors(apiError("The database is busy — please try again in a moment.", 503));
  }
}
