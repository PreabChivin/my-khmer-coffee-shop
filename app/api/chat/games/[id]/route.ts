import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration } from "@/lib/chatModeration";
import { toGameDetailDTO, gameInclude } from "@/lib/gameDto";

/**
 * GET /api/chat/games/[id]
 * Full board state — polled ~every 1.5s while the board overlay is open. Any
 * signed-in member can read it (spectators get mySlot=null); a chat-banned
 * member is blocked, matching the rest of the chat feature. Muted members can
 * still watch (mute only blocks writing/moving).
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
    const game = await prisma.gameSession.findUnique({
      where: { id },
      include: gameInclude,
    });
    if (!game) {
      return NextResponse.json({ error: "រកមិនឃើញការលេងនេះទេ។" }, { status: 404 });
    }
    return NextResponse.json(toGameDetailDTO(game, session.id));
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
