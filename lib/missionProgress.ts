import type { Prisma } from "@prisma/client";
import { getMission, missionTarget, periodKeyForMission } from "@/lib/missions";

/** Works with either the `prisma` singleton or a `tx` handle from inside
 *  `prisma.$transaction`, so callers already inside a points-adjacent
 *  transaction (game-over, pack opening, card upgrade) can bump progress in
 *  the same commit, while callers that aren't (posting a chat message) can
 *  pass the plain client. */
type PrismaLike = Prisma.TransactionClient;

/** 🎯 Records one occurrence of `missionKey` for `userId` in the current
 *  period. Single-step quests (target 1, the default) complete on the first
 *  bump exactly as before; multi-step quests accumulate progressCount and
 *  only stamp completedAt once the target is reached. The period key comes
 *  from the mission's own cadence, so weekly quests land in a weekly row.
 *
 *  Best-effort: never throws past the caller, since a progress bump must
 *  never break the real action (a game finishing, a pack opening) it is
 *  attached to. */
export async function bumpMissionProgress(
  tx: PrismaLike,
  userId: string | null | undefined,
  missionKey: string
): Promise<void> {
  if (!userId) return;
  const mission = getMission(missionKey);
  if (!mission) return;

  try {
    const periodKey = periodKeyForMission(missionKey);
    const target = missionTarget(mission);

    const existing = await tx.userMissionProgress.findUnique({
      where: { userId_missionKey_periodKey: { userId, missionKey, periodKey } },
    });
    if (existing?.completedAt) return;

    const nextCount = (existing?.progressCount ?? 0) + 1;
    const completedAt = nextCount >= target ? new Date() : null;

    await tx.userMissionProgress.upsert({
      where: { userId_missionKey_periodKey: { userId, missionKey, periodKey } },
      create: { userId, missionKey, periodKey, progressCount: nextCount, completedAt },
      update: { progressCount: nextCount, completedAt },
    });
  } catch (err) {
    console.error(`[missionProgress] Failed to bump "${missionKey}" for ${userId}:`, err);
  }
}
