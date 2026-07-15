import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { toChatMessageDTO, chatMessageInclude } from "@/lib/chatDto";
import { initialTicTacToeState } from "@/lib/ticTacToe";
import type { GameType } from "@/lib/types";
import type { Prisma } from "@prisma/client";

const SUPPORTED_GAMES: GameType[] = ["TICTACTOE"];
const GAME_LABEL: Record<GameType, string> = { TICTACTOE: "Tic-Tac-Toe" };

/**
 * POST /api/chat/games
 * Open a challenge to the whole room. Creates a PENDING GameSession (player2
 * stays null until someone accepts) plus a GAME_INVITE chat message linking to
 * it, in one transaction. One open challenge per member at a time so the room
 * doesn't fill with dangling invites.
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
    const existingOpen = await prisma.gameSession.findFirst({
      where: { player1Id: session.id, status: "PENDING" },
      select: { id: true },
    });
    if (existingOpen) {
      return NextResponse.json(
        { error: "អ្នកមានការអញ្ជើញលេងមួយកំពុងរង់ចាំរួចហើយ។" },
        { status: 409 }
      );
    }

    // turn is a placeholder until accept randomizes who goes first.
    const gameState = initialTicTacToeState("player1");

    const message = await prisma.$transaction(async (tx) => {
      const game = await tx.gameSession.create({
        data: {
          gameType,
          status: "PENDING",
          player1Id: session.id,
          gameState: gameState as unknown as Prisma.InputJsonValue,
        },
      });
      return tx.chatMessage.create({
        data: {
          userId: session.id,
          text: `បានអញ្ជើញលេង ${GAME_LABEL[gameType]}! 🎮`,
          kind: "GAME_INVITE",
          gameSessionId: game.id,
        },
        include: chatMessageInclude,
      });
    });

    return NextResponse.json(toChatMessageDTO(message, session.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចបង្កើតការអញ្ជើញលេងបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
