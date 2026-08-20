import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { battleMatchInclude, toBattleMatchDetailDTO } from "@/lib/battleDto";
import { buildRosterCard, DECK_SIZE, type BattleRosterCard } from "@/lib/battleEngine";
import { getSpecies } from "@/lib/creatures";
import { powerOf } from "@/lib/cardEngine";
import type { CreatureCard, Prisma } from "@prisma/client";

async function loadRoster(userId: string): Promise<BattleRosterCard[] | null> {
  const deck = await prisma.battleDeck.findUnique({ where: { userId } });
  if (!deck || deck.cardIds.length !== DECK_SIZE) return null;

  const cards = await prisma.creatureCard.findMany({
    where: { id: { in: deck.cardIds }, userId },
  });
  const byId = new Map(cards.map((c) => [c.id, c]));
  const ordered: CreatureCard[] = [];
  for (const id of deck.cardIds) {
    const c = byId.get(id);
    if (!c) return null; // a saved card was fed away since -- deck is stale
    ordered.push(c);
  }

  return ordered.map((c) => {
    const species = getSpecies(c.speciesId);
    return buildRosterCard({
      id: c.id,
      speciesId: c.speciesId,
      element: species?.element ?? "SHADOW",
      stars: c.stars,
      power: powerOf(c),
    });
  });
}

/**
 * POST /api/battle/quick-match -- the Battle Arena's matchmaking entry
 * point, same create-or-join shape as /api/games/quick-match and
 * /api/quiz/quick-match:
 *   1. Resume any WAITING/ACTIVE match the caller is already in.
 *   2. Else instantly join the oldest open WAITING match -- both rosters
 *      are snapshotted from their saved decks at this exact moment, the
 *      match goes ACTIVE, and a coin flip decides who acts first.
 *   3. Else open a fresh match with the caller's own roster snapshot and
 *      wait.
 * Requires a saved, fully-owned 8-card deck (see /api/battle/deck) --
 * there is no "auto-fill from collection" fallback, so what a player
 * fights with is always exactly what they chose.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  try {
    const mine = await prisma.battleMatch.findFirst({
      where: {
        status: { in: ["WAITING", "ACTIVE"] },
        players: { some: { userId: session.id } },
      },
      orderBy: { createdAt: "desc" },
      include: battleMatchInclude,
    });
    if (mine) {
      return NextResponse.json(toBattleMatchDetailDTO(mine, session.id));
    }

    const roster = await loadRoster(session.id);
    if (!roster) {
      return NextResponse.json(
        { error: "សូមរៀបចំកញ្ចប់ ៨ សន្លឹកជាមុនសិន (Battle Deck)។", code: "NO_DECK" },
        { status: 400 }
      );
    }

    const openMatch = await prisma.battleMatch.findFirst({
      where: { status: "WAITING", players: { none: { userId: session.id } } },
      orderBy: { createdAt: "asc" },
      include: battleMatchInclude,
    });

    if (openMatch && openMatch.players.length === 1) {
      const opponentId = openMatch.players[0].userId;
      const firstTurn = Math.random() < 0.5 ? session.id : opponentId;

      const joined = await prisma.$transaction(async (tx) => {
        await tx.battlePlayer.create({
          data: { matchId: openMatch.id, userId: session.id, roster: roster as unknown as Prisma.InputJsonValue },
        });
        await tx.battleMatch.update({
          where: { id: openMatch.id },
          data: { status: "ACTIVE", turnUserId: firstTurn, lastAction: undefined },
        });
        return tx.battleMatch.findUniqueOrThrow({
          where: { id: openMatch.id },
          include: battleMatchInclude,
        });
      });
      return NextResponse.json(toBattleMatchDetailDTO(joined, session.id));
    }

    const created = await prisma.$transaction(async (tx) => {
      const match = await tx.battleMatch.create({ data: {} });
      await tx.battlePlayer.create({
        data: { matchId: match.id, userId: session.id, roster: roster as unknown as Prisma.InputJsonValue },
      });
      return tx.battleMatch.findUniqueOrThrow({
        where: { id: match.id },
        include: battleMatchInclude,
      });
    });
    return NextResponse.json(toBattleMatchDetailDTO(created, session.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចរកគូប្រកួតបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
