import type { Prisma } from "@prisma/client";
import { todayPeriodKey } from "@/lib/missions";

/** Works with either the `prisma` singleton or a `tx` handle from inside
 *  `prisma.$transaction`, so callers already inside a money-adjacent
 *  transaction (order completion, game-over) can bump progress in the same
 *  commit, while callers that aren't (posting a chat message) can pass the
 *  plain client. */
type PrismaLike = Prisma.TransactionClient;

/** 🎯 Marks one occurrence of `missionKey` for `userId` today. Missions here
 *  are all single-step "did it happen today" checks (not multi-count
 *  targets), so this only needs to stamp `completedAt` once — it's a no-op
 *  once already completed today. Best-effort: never throws past the caller,
 *  since a mission-progress bump must never break the real action (an order
 *  completing, a game finishing, a message sending) it's attached to. */
export async function bumpMissionProgress(
  tx: PrismaLike,
  userId: string | null | undefined,
  missionKey: string
): Promise<void> {
  if (!userId) return;
  try {
    const periodKey = todayPeriodKey();
    const existing = await tx.userMissionProgress.findUnique({
      where: { userId_missionKey_periodKey: { userId, missionKey, periodKey } },
    });
    if (existing?.completedAt) return;

    await tx.userMissionProgress.upsert({
      where: { userId_missionKey_periodKey: { userId, missionKey, periodKey } },
      create: { userId, missionKey, periodKey, progressCount: 1, completedAt: new Date() },
      update: { progressCount: { increment: 1 }, completedAt: new Date() },
    });
  } catch (err) {
    console.error(`[missionProgress] Failed to bump "${missionKey}" for ${userId}:`, err);
  }
}
