/**
 * 🎮 Pure, server-authoritative Tic-Tac-Toe logic for the Café Lounge
 * mini-game. No React, no Prisma — just board math, so both the move API
 * route and any test can share the exact same win/tie rules. The whole board
 * lives in one JSON blob (GameSession.gameState) so a move is a single-row
 * update, never a write per cell.
 */

export type PlayerSlot = "player1" | "player2";

export interface TicTacToeState {
  /** 9 cells, row-major (0-2 top row, 3-5 middle, 6-8 bottom). */
  board: (PlayerSlot | null)[];
  /** Whose move it is right now. */
  turn: PlayerSlot;
}

const WIN_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

/** Fresh empty board. `firstTurn` is randomized by the accept route so neither
 *  player always moves first. */
export function initialTicTacToeState(firstTurn: PlayerSlot): TicTacToeState {
  return { board: Array(9).fill(null), turn: firstTurn };
}

/** Returns the winning slot, or null if no winner yet. */
export function getWinner(board: (PlayerSlot | null)[]): PlayerSlot | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

export function isBoardFull(board: (PlayerSlot | null)[]): boolean {
  return board.every((cell) => cell !== null);
}

/** Runtime shape-guard for the JSON pulled out of Postgres — never trust that
 *  a stored blob is well-formed before indexing into it. */
export function isValidState(value: unknown): value is TicTacToeState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { board?: unknown; turn?: unknown };
  return (
    Array.isArray(v.board) &&
    v.board.length === 9 &&
    v.board.every((c) => c === null || c === "player1" || c === "player2") &&
    (v.turn === "player1" || v.turn === "player2")
  );
}
