import type { Prisma } from "@prisma/client";
import { bumpMissionProgress } from "@/lib/missionProgress";
import { applyExp } from "@/lib/cardEngine";
import { LOSS_EXP_PER_CARD, LOSS_REWARD_POINTS, WIN_EXP_PER_CARD, WIN_REWARD_POINTS } from "@/lib/battleEngine";

type PrismaLike = Prisma.TransactionClient;

/**
 * Grants Diamonds + real EXP to every one of the winner's and loser's 8
 * deck cards once a BattleMatch finishes -- guarded by the caller checking
 * `rewardsGranted` first (see app/api/battle/[id]/action and
 * app/api/battle/[id]/leave, the two paths a match can end from) so this
 * only ever runs once per match even if both end paths raced.
 *
 * EXP is applied to the LIVE CreatureCard rows (not the battle-time roster
 * snapshot), since that snapshot is frozen for fairness but real
 * progression must land on the player's actual collection. A card fed away
 * mid-battle by an unrelated request is skipped silently -- best-effort,
 * same philosophy as bumpMissionProgress.
 */
export async function grantBattleRewards(
  tx: PrismaLike,
  winnerUserId: string,
  winnerRosterCardIds: string[],
  loserUserId: string,
  loserRosterCardIds: string[]
): Promise<void> {
  // User.gameWins/gameLosses stay scoped to the Cafe Lounge board
  // (Tic-Tac-Toe/RPS) per its own doc comment -- Trivia Quiz Show set this
  // precedent already (loyaltyPoints + missions only, no touch to that
  // scoreboard), and Battle Arena follows the same line for consistency.
  await tx.user.update({
    where: { id: winnerUserId },
    data: { loyaltyPoints: { increment: WIN_REWARD_POINTS } },
  });
  await tx.user.update({
    where: { id: loserUserId },
    data: { loyaltyPoints: { increment: LOSS_REWARD_POINTS } },
  });

  await applyCardExp(tx, winnerRosterCardIds, WIN_EXP_PER_CARD);
  await applyCardExp(tx, loserRosterCardIds, LOSS_EXP_PER_CARD);

  await bumpMissionProgress(tx, winnerUserId, "play_game_daily");
  await bumpMissionProgress(tx, winnerUserId, "win_game_daily");
  await bumpMissionProgress(tx, loserUserId, "play_game_daily");
}

async function applyCardExp(tx: PrismaLike, cardIds: string[], expEach: number): Promise<void> {
  for (const cardId of cardIds) {
    const card = await tx.creatureCard.findUnique({ where: { id: cardId } });
    if (!card) continue;
    const next = applyExp(card.level, card.exp, expEach);
    await tx.creatureCard.update({
      where: { id: cardId },
      data: { level: next.level, exp: next.exp },
    });
  }
}
