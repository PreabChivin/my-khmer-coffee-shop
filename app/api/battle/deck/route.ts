import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toCreatureCardDTO } from "@/lib/cardDto";
import { DECK_SIZE } from "@/lib/battleEngine";
import type { BattleDeckResponseDTO } from "@/lib/types";

/** GET /api/battle/deck -- the caller's saved 8-card battle loadout, or an
 *  empty one if they have never saved one yet. */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const deck = await prisma.battleDeck.findUnique({ where: { userId: session.id } });
    if (!deck) {
      const body: BattleDeckResponseDTO = { cardIds: [], cards: [] };
      return NextResponse.json(body);
    }

    const cards = await prisma.creatureCard.findMany({
      where: { id: { in: deck.cardIds }, userId: session.id },
    });
    const byId = new Map(cards.map((c) => [c.id, c]));
    // Preserve the saved slot order; silently drop any id that no longer
    // resolves (the card was fed to another upgrade since the deck was
    // saved) rather than erroring the whole page out.
    const ordered = deck.cardIds.map((id) => byId.get(id)).filter((c) => c !== undefined);

    const body: BattleDeckResponseDTO = {
      cardIds: ordered.map((c) => c.id),
      cards: ordered.map(toCreatureCardDTO),
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}

/** POST /api/battle/deck -- Body: { cardIds: string[8] }. Replaces the
 *  saved deck wholesale. Validates exactly DECK_SIZE distinct ids, all
 *  currently owned by the caller -- a deck can never smuggle in a card
 *  that was fed away or belongs to someone else. */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { cardIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const cardIds = Array.isArray(body.cardIds)
    ? body.cardIds.filter((v): v is string => typeof v === "string")
    : [];
  const distinct = Array.from(new Set(cardIds));

  if (distinct.length !== DECK_SIZE || distinct.length !== cardIds.length) {
    return NextResponse.json(
      { error: `ត្រូវការកាតគត់ ${DECK_SIZE} សន្លឹក ដោយគ្មានស្ទួន។` },
      { status: 400 }
    );
  }

  try {
    const owned = await prisma.creatureCard.count({
      where: { id: { in: distinct }, userId: session.id },
    });
    if (owned !== DECK_SIZE) {
      return NextResponse.json(
        { error: "កាតមួយចំនួនមិនមែនជារបស់អ្នកទេ ឬលែងមានទៀតហើយ។" },
        { status: 400 }
      );
    }

    const deck = await prisma.battleDeck.upsert({
      where: { userId: session.id },
      create: { userId: session.id, cardIds: distinct },
      update: { cardIds: distinct },
    });

    const cards = await prisma.creatureCard.findMany({ where: { id: { in: deck.cardIds } } });
    const byId = new Map(cards.map((c) => [c.id, c]));
    const ordered = deck.cardIds.map((id) => byId.get(id)!).filter(Boolean);

    const result: BattleDeckResponseDTO = {
      cardIds: ordered.map((c) => c.id),
      cards: ordered.map(toCreatureCardDTO),
    };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "មិនអាចរក្សាទុកកញ្ចប់បានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
