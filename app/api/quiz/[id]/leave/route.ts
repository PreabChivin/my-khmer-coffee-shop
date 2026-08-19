import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";

/**
 * POST /api/quiz/[id]/leave — withdraw from a room that hasn't started
 * yet. Once ACTIVE, a player's row stays (their score/answers still
 * matter to the room), so this only ever removes a WAITING-room seat.
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
    const match = await prisma.quizMatch.findUnique({ where: { id }, select: { status: true } });
    if (!match) {
      return NextResponse.json({ success: true });
    }
    if (match.status !== "WAITING") {
      return NextResponse.json({ success: true });
    }

    await prisma.quizPlayer.deleteMany({ where: { matchId: id, userId: session.id } });

    const remaining = await prisma.quizPlayer.count({ where: { matchId: id } });
    if (remaining === 0) {
      await prisma.quizMatch.updateMany({
        where: { id, status: "WAITING" },
        data: { status: "CANCELLED" },
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
