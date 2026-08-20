import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration } from "@/lib/chatModeration";
import { battleMatchInclude, toBattleMatchDetailDTO } from "@/lib/battleDto";

/** GET /api/battle/[id] -- full match state, polled ~every 1.5s while a
 *  battle screen is open, same cadence as GET /api/chat/games/[id] and
 *  GET /api/quiz/[id]. */
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
    const match = await prisma.battleMatch.findUnique({ where: { id }, include: battleMatchInclude });
    if (!match) {
      return NextResponse.json({ error: "រកមិនឃើញការប្រកួតនេះទេ។" }, { status: 404 });
    }
    if (!match.players.some((p) => p.userId === session.id)) {
      return NextResponse.json({ error: "អ្នកមិនមែនជាសមាជិកនៃការប្រកួតនេះទេ។" }, { status: 403 });
    }
    return NextResponse.json(toBattleMatchDetailDTO(match, session.id));
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
