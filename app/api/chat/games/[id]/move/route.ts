import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { toGameDetailDTO, gameInclude } from "@/lib/gameDto";
import {
  getWinner,
  isBoardFull,
  isValidState,
  type PlayerSlot,
  type TicTacToeState,
} from "@/lib/ticTacToe";
import type { Prisma } from "@prisma/client";

/**
 * POST /api/chat/games/[id]/move
 * Body: { cell: 0-8 }
 * Server-authoritative: the move is validated (game ACTIVE, caller is a
 * player, it's THEIR turn, the cell is empty) inside a transaction, so a
 * client can never play out of turn or overwrite a cell. On a win/tie the same
 * transaction updates both players' scoreboards and posts the GAME_RESULT
 * system message — one atomic commit, no partial state.
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

  let body: { cell?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const cell = Number(body.cell);
  if (!Number.isInteger(cell) || cell < 0 || cell > 8) {
    return NextResponse.json({ error: "ប្រអប់មិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  type MoveResult =
    | { ok: false; status: number; error: string }
    | { ok: true };

  try {
    const result = await prisma.$transaction(async (tx): Promise<MoveResult> => {
      const game = await tx.gameSession.findUnique({ where: { id } });
      if (!game) return { ok: false, status: 404, error: "រកមិនឃើញការលេងនេះទេ។" };
      if (game.status !== "ACTIVE") {
        return { ok: false, status: 409, error: "ការលេងនេះមិនកំពុងដំណើរការទេ។" };
      }

      const mySlot: PlayerSlot | null =
        game.player1Id === session.id
          ? "player1"
          : game.player2Id === session.id
            ? "player2"
            : null;
      if (!mySlot) {
        return { ok: false, status: 403, error: "អ្នកមិនមែនជាអ្នកលេងក្នុងការប្រកួតនេះទេ។" };
      }

      if (!isValidState(game.gameState)) {
        return { ok: false, status: 500, error: "ស្ថានភាពការលេងខូច។" };
      }
      const state: TicTacToeState = game.gameState;

      if (state.turn !== mySlot) {
        return { ok: false, status: 409, error: "មិនទាន់ដល់វេនរបស់អ្នកទេ។" };
      }
      if (state.board[cell] !== null) {
        return { ok: false, status: 400, error: "ប្រអប់នេះមានគេលេងរួចហើយ។" };
      }

      const board = [...state.board];
      board[cell] = mySlot;

      const winnerSlot = getWinner(board);
      const full = isBoardFull(board);

      if (winnerSlot) {
        const winnerId = winnerSlot === "player1" ? game.player1Id : game.player2Id!;
        const loserId = winnerSlot === "player1" ? game.player2Id! : game.player1Id;
        const nextState: TicTacToeState = { board, turn: state.turn };
        await tx.gameSession.update({
          where: { id },
          data: {
            gameState: nextState as unknown as Prisma.InputJsonValue,
            status: "COMPLETED",
            winnerId,
          },
        });
        await tx.user.update({ where: { id: winnerId }, data: { gameWins: { increment: 1 } } });
        await tx.user.update({ where: { id: loserId }, data: { gameLosses: { increment: 1 } } });

        const [winner, loser] = await Promise.all([
          tx.user.findUnique({ where: { id: winnerId }, select: { name: true } }),
          tx.user.findUnique({ where: { id: loserId }, select: { name: true } }),
        ]);
        await tx.chatMessage.create({
          data: {
            userId: winnerId,
            kind: "GAME_RESULT",
            gameSessionId: id,
            text: `🎉 ${winner?.name ?? "នរណាម្នាក់"} បានឈ្នះ Tic-Tac-Toe លើ ${loser?.name ?? "គូប្រកួត"}!`,
          },
        });
        return { ok: true };
      }

      if (full) {
        const nextState: TicTacToeState = { board, turn: state.turn };
        await tx.gameSession.update({
          where: { id },
          data: {
            gameState: nextState as unknown as Prisma.InputJsonValue,
            status: "COMPLETED",
            isTie: true,
          },
        });
        await tx.user.update({ where: { id: game.player1Id }, data: { gameTies: { increment: 1 } } });
        await tx.user.update({ where: { id: game.player2Id! }, data: { gameTies: { increment: 1 } } });

        const [p1, p2] = await Promise.all([
          tx.user.findUnique({ where: { id: game.player1Id }, select: { name: true } }),
          tx.user.findUnique({ where: { id: game.player2Id! }, select: { name: true } }),
        ]);
        await tx.chatMessage.create({
          data: {
            userId: game.player1Id,
            kind: "GAME_RESULT",
            gameSessionId: id,
            text: `🤝 ${p1?.name ?? "អ្នកលេង"} និង ${p2?.name ?? "អ្នកលេង"} បានស្មើគ្នាក្នុង Tic-Tac-Toe!`,
          },
        });
        return { ok: true };
      }

      // Game continues — flip the turn.
      const nextTurn: PlayerSlot = mySlot === "player1" ? "player2" : "player1";
      const nextState: TicTacToeState = { board, turn: nextTurn };
      await tx.gameSession.update({
        where: { id },
        data: { gameState: nextState as unknown as Prisma.InputJsonValue },
      });
      return { ok: true };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const updated = await prisma.gameSession.findUniqueOrThrow({
      where: { id },
      include: gameInclude,
    });
    return NextResponse.json(toGameDetailDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចលេងបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
