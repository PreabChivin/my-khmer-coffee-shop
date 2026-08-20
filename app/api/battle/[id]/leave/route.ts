import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { battleMatchInclude } from "@/lib/battleDto";
import { grantBattleRewards } from "@/lib/battleRewards";
import type { BattleRosterCard } from "@/lib/battleEngine";

/**
 * POST /api/battle/[id]/leave -- withdraw from a match.
 *   - WAITING: just removes the caller's seat (and cancels the room if that
 *     leaves it empty), same as the quiz/1v1 leave routes.
 *   - ACTIVE: counts as a forfeit -- the opponent is awarded the win and the
 *     normal victory rewards, rather than leaving their match stuck forever
 *     waiting on a turn that will never come.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const match = await prisma.battleMatch.findUnique({ where: { id }, include: battleMatchInclude });
    if (!match) {
      return NextResponse.json({ success: true });
    }

    if (match.status === "WAITING") {
      await prisma.battlePlayer.deleteMany({ where: { matchId: id, userId: session.id } });
      const remaining = await prisma.battlePlayer.count({ where: { matchId: id } });
      if (remaining === 0) {
        await prisma.battleMatch.updateMany({
          where: { id, status: "WAITING" },
          data: { status: "CANCELLED" },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (match.status === "ACTIVE") {
      const opponent = match.players.find((p) => p.userId !== session.id);
      const me = match.players.find((p) => p.userId === session.id);
      if (!opponent || !me) {
        return NextResponse.json({ success: true });
      }

      await prisma.$transaction(async (tx) => {
        const claim = await tx.battleMatch.updateMany({
          where: { id, status: "ACTIVE" },
          data: { status: "COMPLETED", winnerUserId: opponent.userId, turnUserId: null },
        });
        if (claim.count === 0) return; // already finished by the time we got here

        const fresh = await tx.battleMatch.findUniqueOrThrow({ where: { id } });
        if (!fresh.rewardsGranted) {
          await grantBattleRewards(
            tx,
            opponent.userId,
            (opponent.roster as unknown as BattleRosterCard[]).map((c) => c.cardId),
            session.id,
            (me.roster as unknown as BattleRosterCard[]).map((c) => c.cardId)
          );
          await tx.battleMatch.update({ where: { id }, data: { rewardsGranted: true } });
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
