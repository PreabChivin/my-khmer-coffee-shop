import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { toGameDetailDTO, gameInclude } from "@/lib/gameDto";
import { initialTicTacToeState, type PlayerSlot } from "@/lib/ticTacToe";
import { initialRPSState } from "@/lib/rps";
import type { GameType } from "@/lib/types";
import type { Prisma } from "@prisma/client";

const SUPPORTED_GAMES: GameType[] = ["TICTACTOE", "RPS"];

/**
 * POST /api/games/quick-match — Body: { gameType }
 * The Game Arena's direct "PLAY NOW" entry point — no chat invite step.
 * Reuses the exact same GameSession rows/atomic-claim pattern as the chat
 * challenge flow (app/api/chat/games/*), just with a different entry point:
 *   1. Resume any open PENDING/ACTIVE session the caller is already in
 *      (repeat clicks/reloads never duplicate or error).
 *   2. Else instantly claim someone else's open untargeted PENDING
 *      challenge of the same gameType — the same guarded `updateMany` claim
 *      /api/chat/games/[id]/accept uses, so a race between two quick-match
 *      clicks can only ever seat one of them.
 *   3. Else open a new PENDING challenge as player1 and return it; the
 *      client shows the waiting room and polls the existing
 *      GET /api/chat/games/[id] until another quick-match click joins it.
 * No new game-move/win logic here — moves, wins, and points all still flow
 * through the same, already-live app/api/chat/games/[id]/move route.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  let body: { gameType?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const gameType = (typeof body.gameType === "string" ? body.gameType : "TICTACTOE") as GameType;
  if (!SUPPORTED_GAMES.includes(gameType)) {
    return NextResponse.json({ error: "ប្រភេទហ្គេមមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  try {
    // 1. Resume any open session I'm already part of, in ANY game type —
    // avoids duplicate PENDING rows if the user re-clicks or reloads.
    const mine = await prisma.gameSession.findFirst({
      where: {
        status: { in: ["PENDING", "ACTIVE"] },
        OR: [{ player1Id: session.id }, { player2Id: session.id }],
      },
      orderBy: { createdAt: "desc" },
      include: gameInclude,
    });
    if (mine) {
      return NextResponse.json(toGameDetailDTO(mine, session.id));
    }

    // 2. Try to instantly claim someone else's open, untargeted challenge.
    const openChallenge = await prisma.gameSession.findFirst({
      where: {
        gameType,
        status: "PENDING",
        targetUserId: null,
        player1Id: { not: session.id },
        player2Id: null,
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, gameType: true },
    });

    if (openChallenge) {
      const firstTurn: PlayerSlot = Math.random() < 0.5 ? "player1" : "player2";
      const gameState =
        openChallenge.gameType === "RPS" ? initialRPSState() : initialTicTacToeState(firstTurn);

      const claim = await prisma.gameSession.updateMany({
        where: { id: openChallenge.id, status: "PENDING", player2Id: null },
        data: {
          player2Id: session.id,
          status: "ACTIVE",
          gameState: gameState as unknown as Prisma.InputJsonValue,
        },
      });
      if (claim.count > 0) {
        const joined = await prisma.gameSession.findUniqueOrThrow({
          where: { id: openChallenge.id },
          include: gameInclude,
        });
        return NextResponse.json(toGameDetailDTO(joined, session.id));
      }
      // Someone else claimed it a moment earlier — fall through to opening
      // a fresh challenge instead of failing the click.
    }

    // 3. Nobody to instantly match with — open a new challenge and wait.
    const gameState = gameType === "RPS" ? initialRPSState() : initialTicTacToeState("player1");
    const created = await prisma.gameSession.create({
      data: {
        gameType,
        status: "PENDING",
        player1Id: session.id,
        gameState: gameState as unknown as Prisma.InputJsonValue,
      },
      include: gameInclude,
    });
    return NextResponse.json(toGameDetailDTO(created, session.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចរកគូប្រកួតបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
