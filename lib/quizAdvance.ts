import type { Prisma } from "@prisma/client";
import { bumpMissionProgress } from "@/lib/missionProgress";
import { PARTICIPATION_REWARD_POINTS, PODIUM_REWARD_POINTS } from "@/lib/quizEngine";

type PrismaLike = Prisma.TransactionClient;

/**
 * Atomically advances a quiz match past `expectedIndex` — to the next
 * question, or to COMPLETED (+ grants podium rewards, once) if that was
 * the last one. Guarded by an `updateMany` on `currentQuestionIndex`, the
 * same atomic-claim idiom every other write path in this app uses (see
 * app/api/chat/games/[id]/accept), so a race between "the last player just
 * answered" and "the timeout fired" can only ever advance once — the
 * loser of the race just no-ops and the caller re-reads the fresh state.
 */
export async function tryAdvanceQuizMatch(
  tx: PrismaLike,
  matchId: string,
  expectedIndex: number,
  totalQuestions: number
): Promise<boolean> {
  const nextIndex = expectedIndex + 1;
  const isLast = nextIndex >= totalQuestions;

  if (!isLast) {
    const claim = await tx.quizMatch.updateMany({
      where: { id: matchId, currentQuestionIndex: expectedIndex, status: "ACTIVE" },
      data: { currentQuestionIndex: nextIndex, currentQuestionStartedAt: new Date() },
    });
    return claim.count > 0;
  }

  const claim = await tx.quizMatch.updateMany({
    where: { id: matchId, currentQuestionIndex: expectedIndex, status: "ACTIVE" },
    data: { status: "COMPLETED", currentQuestionStartedAt: null },
  });
  if (claim.count === 0) return false;

  const fresh = await tx.quizMatch.findUniqueOrThrow({
    where: { id: matchId },
    include: { players: true },
  });
  if (!fresh.rewardsGranted) {
    const ranked = [...fresh.players].sort((a, b) => b.score - a.score);
    for (let i = 0; i < ranked.length; i++) {
      const reward = i < PODIUM_REWARD_POINTS.length ? PODIUM_REWARD_POINTS[i] : PARTICIPATION_REWARD_POINTS;
      await tx.user.update({
        where: { id: ranked[i].userId },
        data: { loyaltyPoints: { increment: reward } },
      });
      await bumpMissionProgress(tx, ranked[i].userId, "play_game_daily");
    }
    if (ranked[0]) {
      await bumpMissionProgress(tx, ranked[0].userId, "win_game_daily");
    }
    await tx.quizMatch.update({ where: { id: matchId }, data: { rewardsGranted: true } });
  }
  return true;
}
