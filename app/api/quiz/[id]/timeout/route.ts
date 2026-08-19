import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { quizMatchInclude, toQuizMatchDetailDTO } from "@/lib/quizDto";
import { tryAdvanceQuizMatch } from "@/lib/quizAdvance";
import { QUESTION_DURATION_MS } from "@/lib/quizEngine";

/**
 * POST /api/quiz/[id]/timeout — any client polling this room calls it once
 * its local countdown hits 0, as a belt-and-suspenders way to keep the
 * room moving even if not every player answers in time. The server
 * independently re-checks the real deadline before honoring it (a small
 * grace window absorbs clock skew) — a client can't force an early skip
 * just by calling this early. No-ops harmlessly if someone already
 * advanced the room (tryAdvanceQuizMatch's own atomic guard).
 */
const CLOCK_SKEW_GRACE_MS = 500;

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

    if (match.status === "ACTIVE" && match.currentQuestionStartedAt) {
      const elapsed = Date.now() - match.currentQuestionStartedAt.getTime();
      if (elapsed >= QUESTION_DURATION_MS - CLOCK_SKEW_GRACE_MS) {
        await prisma.$transaction((tx) =>
          tryAdvanceQuizMatch(tx, id, match.currentQuestionIndex, match.questionIds.length)
        );
      }
    }

    const fresh = await prisma.quizMatch.findUniqueOrThrow({ where: { id }, include: quizMatchInclude });
    return NextResponse.json(toQuizMatchDetailDTO(fresh, session.id));
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
