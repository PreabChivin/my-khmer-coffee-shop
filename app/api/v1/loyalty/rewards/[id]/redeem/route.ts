import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/customerAuth";
import { redeemReward } from "@/lib/redeemReward";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * POST /api/v1/loyalty/rewards/[id]/redeem
 * Same atomic, guarded point-deduction logic as the web app
 * (lib/redeemReward.ts) — cannot over-spend or double-redeem.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("សូមចូលគណនីជាមុនសិន។", 401));
  }

  const { id } = await params;
  const result = await redeemReward(session.id, id);
  if (!result.ok) {
    return withCors(apiError(result.error, result.status));
  }
  return withCors(apiSuccess(result.body));
}
