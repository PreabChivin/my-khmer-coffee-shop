import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { getMission, periodKeyForMission } from "@/lib/missions";
import { toUserDTO } from "@/lib/userDto";
import type { UserDTO } from "@/lib/types";
import type { User } from "@prisma/client";

const NOT_READY = "NOT_READY";

type ClaimTxResult = { ok: false; error: string } | { ok: true; user: User | null };

/**
 * POST /api/missions/claim — Body: { missionKey }
 * Atomic claim: `updateMany` on the progress row guarded by
 * `completedAt IS NOT NULL AND claimedAt IS NULL` (same race-proof shape as
 * lib/redeemReward.ts's points-balance guard), then credits the mission's
 * rewardPoints onto the SAME loyaltyPoints balance the Avatar Shop spends.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { missionKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const mission = typeof body.missionKey === "string" ? getMission(body.missionKey) : undefined;
  if (!mission) {
    return NextResponse.json({ error: "បេសកកម្មនេះមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  try {
    const periodKey = periodKeyForMission(mission.key);
    const result = await prisma.$transaction(async (tx): Promise<ClaimTxResult> => {
      const claim = await tx.userMissionProgress.updateMany({
        where: {
          userId: session.id,
          missionKey: mission.key,
          periodKey,
          completedAt: { not: null },
          claimedAt: null,
        },
        data: { claimedAt: new Date() },
      });
      if (claim.count === 0) {
        return { ok: false, error: NOT_READY };
      }

      const user = await tx.user.update({
        where: { id: session.id },
        data: { loyaltyPoints: { increment: mission.rewardPoints } },
      });
      return { ok: true, user };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "អ្នកមិនទាន់បញ្ចប់បេសកកម្មនេះទេ ឬបានទទួលរង្វាន់រួចហើយ។" },
        { status: 409 }
      );
    }

    const userDto: UserDTO | null = result.user ? toUserDTO(result.user) : null;
    return NextResponse.json({ success: true, user: userDto, rewardPoints: mission.rewardPoints });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចទទួលរង្វាន់បានទេឥឡូវនេះ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
