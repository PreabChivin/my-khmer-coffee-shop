import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toCreatureCardDTO } from "@/lib/cardDto";
import { PACK_COST, rollPack } from "@/lib/cardEngine";
import { bumpMissionProgress } from "@/lib/missionProgress";
import type { PackOpenResultDTO } from "@/lib/types";

/**
 * POST /api/cards/packs/open — buys and opens one booster pack.
 *
 * The pack is rolled SERVER-SIDE (lib/cardEngine) and the Diamond charge is
 * a guarded `updateMany` on `loyaltyPoints >= PACK_COST` — the same
 * race-proof atomic-claim shape every other points-spend in this app uses
 * (lib/shopPurchase.ts, the missions claim route). A client can neither
 * choose its own pull nor spend Diamonds it doesn't have.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const rolled = rollPack();

    const result = await prisma.$transaction(async (tx) => {
      const charged = await tx.user.updateMany({
        where: { id: session.id, loyaltyPoints: { gte: PACK_COST } },
        data: { loyaltyPoints: { decrement: PACK_COST } },
      });
      if (charged.count === 0) return null;

      await tx.creatureCard.createMany({
        data: rolled.map((c) => ({
          userId: session.id,
          speciesId: c.speciesId,
          stars: c.stars,
          baseCp: c.baseCp,
          isShiny: c.isShiny,
        })),
      });

      // Newest-first, limited to this pack's size — these were all just
      // created in this transaction.
      const created = await tx.creatureCard.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: rolled.length,
      });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: session.id },
        select: { loyaltyPoints: true },
      });

      await bumpMissionProgress(tx, session.id, "open_pack_daily");
      await bumpMissionProgress(tx, session.id, "open_packs_weekly");

      return { created, loyaltyPoints: user.loyaltyPoints };
    });

    if (!result) {
      return NextResponse.json(
        { error: `ពិន្ទុមិនគ្រប់គ្រាន់ទេ — ត្រូវការ ${PACK_COST} 💎។` },
        { status: 409 }
      );
    }

    const body: PackOpenResultDTO = {
      cards: result.created.map(toCreatureCardDTO),
      loyaltyPoints: result.loyaltyPoints,
    };
    return NextResponse.json(body, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចបើកកញ្ចប់បានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
