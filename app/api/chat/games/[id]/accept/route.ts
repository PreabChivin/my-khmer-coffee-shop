import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { toGameDetailDTO, gameInclude } from "@/lib/gameDto";
import { initialTicTacToeState, type PlayerSlot } from "@/lib/ticTacToe";
import { initialRPSState } from "@/lib/rps";
import type { Prisma } from "@prisma/client";

/**
 * POST /api/chat/games/[id]/accept
 * The first member (other than the challenger) to accept an open challenge
 * becomes player2 and starts the match. Uses a guarded updateMany
 * (WHERE status=PENDING AND player2Id IS NULL) so if two people race to
 * accept, only one can win the claim — the same atomic-claim pattern the
 * group-cart checkout uses.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id } = await params;

  try {
    const game = await prisma.gameSession.findUnique({
      where: { id },
      select: { player1Id: true, status: true, gameType: true, targetUserId: true },
    });
    if (!game) {
      return NextResponse.json({ error: "រកមិនឃើញការលេងនេះទេ។" }, { status: 404 });
    }
    if (game.player1Id === session.id) {
      return NextResponse.json(
        { error: "អ្នកមិនអាចទទួលយកការអញ្ជើញរបស់ខ្លួនឯងបានទេ។" },
        { status: 400 }
      );
    }
    if (game.targetUserId && game.targetUserId !== session.id) {
      return NextResponse.json(
        { error: "ការអញ្ជើញនេះសម្រាប់សមាជិកម្នាក់ទៀត។" },
        { status: 403 }
      );
    }

    // Coin-flip who moves first (Tic-Tac-Toe only — RPS has no turn order),
    // then atomically claim the open slot.
    const firstTurn: PlayerSlot = Math.random() < 0.5 ? "player1" : "player2";
    const gameState =
      game.gameType === "RPS" ? initialRPSState() : initialTicTacToeState(firstTurn);

    const claim = await prisma.gameSession.updateMany({
      where: { id, status: "PENDING", player2Id: null },
      data: {
        player2Id: session.id,
        status: "ACTIVE",
        gameState: gameState as unknown as Prisma.InputJsonValue,
      },
    });
    if (claim.count === 0) {
      return NextResponse.json(
        { error: "ការលេងនេះត្រូវបានទទួលយក ឬបានបោះបង់រួចហើយ។" },
        { status: 409 }
      );
    }

    const updated = await prisma.gameSession.findUniqueOrThrow({
      where: { id },
      include: gameInclude,
    });
    return NextResponse.json(toGameDetailDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចចូលរួមការលេងបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
