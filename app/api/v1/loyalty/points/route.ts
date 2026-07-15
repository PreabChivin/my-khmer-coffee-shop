import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { tierProgress } from "@/lib/loyaltyPoints";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/loyalty/points
 * Current balance plus tier progress, computed server-side so a mobile
 * client doesn't have to reimplement the tier math itself.
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("សូមចូលគណនីជាមុនសិន។", 401));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { loyaltyPoints: true },
  });
  if (!user) {
    return withCors(apiError("រកមិនឃើញគណនីនេះទេ។", 404));
  }

  const progress = tierProgress(user.loyaltyPoints);
  return withCors(
    apiSuccess({
      points: user.loyaltyPoints,
      tier: progress.current,
      nextTier: progress.next,
      percentToNextTier: progress.percent,
      pointsToNextTier: progress.pointsToNext,
    })
  );
}
