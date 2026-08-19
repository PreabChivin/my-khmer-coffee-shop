import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { quizMatchInclude, toQuizMatchDetailDTO } from "@/lib/quizDto";

const MIN_PLAYERS_TO_START = 2;

/**
 * POST /api/quiz/[id]/start — any participant can start the room early
 * once >=2 players have joined, rather than waiting for it to fill to
 * capacity. Without an AI-bot filler (deliberately out of scope — see the
 * Quick Match lobby's own commit message), requiring a full room could
 * otherwise leave a party room waiting forever on a quiet day.
 * Guarded by an updateMany on status=WAITING, so only one of several
 * near-simultaneous "Start Now" clicks actually transitions the room.
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
    const match = await prisma.quizMatch.findUnique({ where: { id }, include: quizMatchInclude });
    if (!match) {
      return NextResponse.json({ error: "រកមិនឃើញបន្ទប់សំណួរនេះទេ។" }, { status: 404 });
    }
    if (!match.players.some((p) => p.userId === session.id)) {
      return NextResponse.json({ error: "អ្នកមិនមែនជាសមាជិកបន្ទប់នេះទេ។" }, { status: 403 });
    }
    if (match.players.length < MIN_PLAYERS_TO_START) {
      return NextResponse.json(
        { error: `ត្រូវការអ្នកលេងយ៉ាងតិច ${MIN_PLAYERS_TO_START} នាក់។` },
        { status: 400 }
      );
    }

    const claim = await prisma.quizMatch.updateMany({
      where: { id, status: "WAITING" },
      data: { status: "ACTIVE", currentQuestionIndex: 0, currentQuestionStartedAt: new Date() },
    });
    if (claim.count === 0) {
      return NextResponse.json(
        { error: "បន្ទប់នេះបានចាប់ផ្តើមរួចហើយ។" },
        { status: 409 }
      );
    }

    const updated = await prisma.quizMatch.findUniqueOrThrow({ where: { id }, include: quizMatchInclude });
    return NextResponse.json(toQuizMatchDetailDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចចាប់ផ្តើមបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
