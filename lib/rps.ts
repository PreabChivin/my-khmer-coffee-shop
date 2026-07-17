/**
 * ✊✋✌️ Pure, server-authoritative Rock-Paper-Scissors logic for the Café
 * Lounge mini-game — the second GameType alongside Tic-Tac-Toe, reusing the
 * exact same GameSession row shape (gameState is a flexible JSON blob, so no
 * schema change was needed). Unlike Tic-Tac-Toe there is no "turn": both
 * players submit a single simultaneous choice, and the round resolves the
 * instant both are in.
 */

export type RPSChoice = "rock" | "paper" | "scissors";

export interface RPSState {
  player1Choice: RPSChoice | null;
  player2Choice: RPSChoice | null;
}

export const RPS_CHOICES: RPSChoice[] = ["rock", "paper", "scissors"];

export const RPS_EMOJI: Record<RPSChoice, string> = {
  rock: "🪨",
  paper: "🧻",
  scissors: "✂️",
};

export function initialRPSState(): RPSState {
  return { player1Choice: null, player2Choice: null };
}

/** Runtime shape-guard for the JSON pulled out of Postgres. */
export function isValidRPSState(value: unknown): value is RPSState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { player1Choice?: unknown; player2Choice?: unknown };
  const isChoice = (c: unknown): c is RPSChoice | null =>
    c === null || c === "rock" || c === "paper" || c === "scissors";
  return isChoice(v.player1Choice) && isChoice(v.player2Choice);
}

/** Classic rules: rock beats scissors, scissors beats paper, paper beats rock. */
export function resolveRPS(
  a: RPSChoice,
  b: RPSChoice
): "player1" | "player2" | "tie" {
  if (a === b) return "tie";
  const BEATS: Record<RPSChoice, RPSChoice> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };
  return BEATS[a] === b ? "player1" : "player2";
}
