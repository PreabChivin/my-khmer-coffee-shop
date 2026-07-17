import type { GameSession, User } from "@prisma/client";
import { isValidState, type PlayerSlot } from "@/lib/ticTacToe";
import { isValidRPSState } from "@/lib/rps";
import type { GameDetailDTO, GameStatus, GameType, RPSDetailState } from "@/lib/types";

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
  const mySlot: "player1" | "player2" | null =
    game.player1Id === viewerId
      ? "player1"
      : game.player2Id === viewerId
        ? "player2"
        : null;

  const base = {
    id: game.id,
    gameType: game.gameType as GameType,
    status: game.status as GameStatus,
    player1: { id: game.player1.id, name: game.player1.name },
    player2: game.player2 ? { id: game.player2.id, name: game.player2.name } : null,
    winnerId: game.winnerId,
    isTie: game.isTie,
    mySlot,
  };

  if (game.gameType === "RPS") {
    const rpsState = isValidRPSState(game.gameState)
      ? game.gameState
      : { player1Choice: null, player2Choice: null };
    const myChoice = mySlot ? rpsState[mySlot === "player1" ? "player1Choice" : "player2Choice"] : null;
    const opponentChoice = mySlot
      ? rpsState[mySlot === "player1" ? "player2Choice" : "player1Choice"]
      : null;
    const rps: RPSDetailState = {
      myChoice,
      opponentHasChosen: opponentChoice !== null,
      // Only reveal the opponent's pick once the round is fully resolved.
      opponentChoice: game.status === "COMPLETED" ? opponentChoice : null,
    };
    return {
      ...base,
      board: [],
      currentTurnPlayerId: null,
      player1: { ...base.player1, mark: "🎮" },
      player2: base.player2 ? { ...base.player2, mark: "🎮" } : null,
      rps,
    };
  }

  const state = isValidState(game.gameState)
    ? game.gameState
    : { board: Array<PlayerSlot | null>(9).fill(null), turn: "player1" as PlayerSlot };
  const board = state.board.map((slot) => (slot ? SLOT_MARKS[slot] : null));
  const currentTurnPlayerId =
    game.status === "ACTIVE"
      ? state.turn === "player1"
        ? game.player1Id
        : game.player2Id
      : null;

  return {
    ...base,
    board,
    currentTurnPlayerId,
    player1: { ...base.player1, mark: SLOT_MARKS.player1 },
    player2: base.player2 ? { ...base.player2, mark: SLOT_MARKS.player2 } : null,
    rps: null,
  };
}

/** Prisma include for a game with both players' public fields. */
export const gameInclude = {
  player1: { select: { id: true, name: true } },
  player2: { select: { id: true, name: true } },
} as const;
