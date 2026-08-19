import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import {
  MISSIONS,
  currentWeekPeriodKey,
  missionTarget,
  todayPeriodKey,
} from "@/lib/missions";
import type { MissionDTO } from "@/lib/types";

/** GET /api/missions — every daily + weekly quest with this user's progress
 *  for the current period. Daily and weekly rows live under different
 *  periodKeys, so both are fetched in one query and matched per mission. */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const dayKey = todayPeriodKey();
    const weekKey = currentWeekPeriodKey();

    const rows = await prisma.userMissionProgress.findMany({
      where: { userId: session.id, periodKey: { in: [dayKey, weekKey] } },
    });
    const rowFor = (missionKey: string, periodKey: string) =>
      rows.find((r) => r.missionKey === missionKey && r.periodKey === periodKey);

    const body: MissionDTO[] = MISSIONS.map((m) => {
      const cadence = m.cadence ?? "DAILY";
      const row = rowFor(m.key, cadence === "WEEKLY" ? weekKey : dayKey);
      return {
        key: m.key,
        title: m.title,
        titleKh: m.titleKh,
        emoji: m.emoji,
        rewardPoints: m.rewardPoints,
        completed: Boolean(row?.completedAt),
        claimed: Boolean(row?.claimedAt),
        progress: row?.progressCount ?? 0,
        target: missionTarget(m),
        cadence,
      };
    });

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
