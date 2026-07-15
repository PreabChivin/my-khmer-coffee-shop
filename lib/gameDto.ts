import type { GameSession, User } from "@prisma/client";
import { isValidState, type PlayerSlot } from "@/lib/ticTacToe";
import type { GameDetailDTO, GameStatus, GameType } from "@/lib/types";

/** Emoji markers per player slot — resolved server-side so the client renders
 *  the board without knowing the slot→symbol mapping. */
export const SLOT_MARKS: Record<PlayerSlot, string> = {
  player1: "❌",
  player2: "⭕",
};

type GameWithPlayers = GameSession & {
  player1: Pick<User, "id" | "name">;
  player2: Pick<User, "id" | "name"> | null;
};

export function toGameDetailDTO(game: GameWithPlayers, viewerId: string): GameDetailDTO {
  const state = isValidState(game.gameState)
    ? game.gameState
    : { board: Array<PlayerSlot | null>(9).fill(null), turn: "player1" as PlayerSlot };

  const board = state.board.map((slot) => (slot ? SLOT_MARKS[slot] : null));

  const mySlot: "player1" | "player2" | null =
    game.player1Id === viewerId
      ? "player1"
      : game.player2Id === viewerId
        ? "player2"
        : null;

  const currentTurnPlayerId =
    game.status === "ACTIVE"
      ? state.turn === "player1"
        ? game.player1Id
        : game.player2Id
      : null;

  return {
    id: game.id,
    gameType: game.gameType as GameType,
    status: game.status as GameStatus,
    board,
    player1: { id: game.player1.id, name: game.player1.name, mark: SLOT_MARKS.player1 },
    player2: game.player2
      ? { id: game.player2.id, name: game.player2.name, mark: SLOT_MARKS.player2 }
      : null,
    currentTurnPlayerId,
    winnerId: game.winnerId,
    isTie: game.isTie,
    mySlot,
  };
}

/** Prisma include for a game with both players' public fields. */
export const gameInclude = {
  player1: { select: { id: true, name: true } },
  player2: { select: { id: true, name: true } },
} as const;
