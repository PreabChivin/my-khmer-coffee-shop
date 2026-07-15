import { prisma } from "@/lib/prisma";
import type { RewardDTO } from "@/lib/types";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1/loyalty/rewards
 * Public list of redeemable rewards, cheapest first.
 */
export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isAvailable: true },
      orderBy: { cost: "asc" },
    });
    const body: RewardDTO[] = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      nameKh: r.nameKh,
      cost: r.cost,
      emoji: r.emoji,
      description: r.description,
      isAvailable: r.isAvailable,
    }));
    return withCors(apiSuccess(body));
  } catch {
    return withCors(apiError("ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។", 503));
  }
}
