import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toCreatureCardDTO } from "@/lib/cardDto";
import { PACK_COST } from "@/lib/cardEngine";
import type { CollectionResponseDTO } from "@/lib/types";

/** GET /api/cards/collection — every creature this player owns, plus their
 *  live Diamond balance. Filtering/sorting is done client-side: a personal
 *  collection is small enough that paging it would add complexity for no
 *  real benefit. */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const [cards, user] = await Promise.all([
      prisma.creatureCard.findMany({
        where: { userId: session.id },
        orderBy: [{ stars: "desc" }, { createdAt: "desc" }],
      }),
      prisma.user.findUnique({
        where: { id: session.id },
        select: { loyaltyPoints: true },
      }),
    ]);

    const body: CollectionResponseDTO = {
      cards: cards.map(toCreatureCardDTO),
      loyaltyPoints: user?.loyaltyPoints ?? 0,
      packCost: PACK_COST,
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
