import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { MISSIONS, todayPeriodKey } from "@/lib/missions";
import type { MissionDTO } from "@/lib/types";

/** GET /api/missions — today's 4 missions plus this user's progress. */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const periodKey = todayPeriodKey();
    const rows = await prisma.userMissionProgress.findMany({
      where: { userId: session.id, periodKey },
    });
    const rowByKey = new Map(rows.map((r) => [r.missionKey, r]));

    const body: MissionDTO[] = MISSIONS.map((m) => {
      const row = rowByKey.get(m.key);
      return {
        key: m.key,
        title: m.title,
        titleKh: m.titleKh,
        emoji: m.emoji,
        rewardPoints: m.rewardPoints,
        completed: Boolean(row?.completedAt),
        claimed: Boolean(row?.claimedAt),
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
