import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { rollSpinPrize, SPIN_MISSION_KEY } from "@/lib/spin";
import { todayPeriodKey } from "@/lib/missions";
import type { SpinResultDTO, SpinStatusDTO } from "@/lib/types";

/** GET /api/spin — has this user already claimed today's Lucky Spin? */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }
  try {
    const row = await prisma.userMissionProgress.findUnique({
      where: {
        userId_missionKey_periodKey: {
          userId: session.id,
          missionKey: SPIN_MISSION_KEY,
          periodKey: todayPeriodKey(),
        },
      },
    });
    const body: SpinStatusDTO = { alreadySpunToday: Boolean(row) };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}

/**
 * POST /api/spin — claims today's Lucky Spin, once per calendar day. The
 * prize is rolled server-side (never trust a client-supplied amount); the
 * once-per-day guard is a `create` on UserMissionProgress's
 * [userId, missionKey, periodKey] unique constraint — a second attempt the
 * same day hits P2002, same race-proof shape as every other points-write
 * path in this app.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const periodKey = todayPeriodKey();
    const prize = rollSpinPrize();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.userMissionProgress.create({
        data: {
          userId: session.id,
          missionKey: SPIN_MISSION_KEY,
          periodKey,
          progressCount: 1,
          completedAt: new Date(),
          claimedAt: new Date(),
        },
      });
      return tx.user.update({
        where: { id: session.id },
        data: { loyaltyPoints: { increment: prize } },
        select: { loyaltyPoints: true },
      });
    });

    const body: SpinResultDTO = { pointsWon: prize, loyaltyPoints: updated.loyaltyPoints };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "អ្នកបានបង្វិលរួចហើយថ្ងៃនេះ! សូមមកវិញថ្ងៃស្អែក ✨" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "មិនអាចបង្វិលកង់បានទេឥឡូវនេះ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
