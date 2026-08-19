import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration } from "@/lib/chatModeration";
import { quizMatchInclude, toQuizMatchDetailDTO } from "@/lib/quizDto";

/**
 * GET /api/quiz/[id] — full room/match state, polled ~every 1.5s while a
 * quiz screen is open, exactly like GET /api/chat/games/[id].
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, false);
  if (modCheck.blocked) {
    return NextResponse.json({ error: modCheck.reason }, { status: 403 });
  }

  const { id } = await params;

  try {
    const match = await prisma.quizMatch.findUnique({ where: { id }, include: quizMatchInclude });
    if (!match) {
      return NextResponse.json({ error: "រកមិនឃើញបន្ទប់សំណួរនេះទេ។" }, { status: 404 });
    }
    return NextResponse.json(toQuizMatchDetailDTO(match, session.id));
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
