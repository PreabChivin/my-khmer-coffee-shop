/**
 * 🕹️ Trivia Quiz Show — timing/scoring constants + pure scoring math. No
 * React, no Prisma — shared between the API routes and lib/quizDto.ts,
 * same separation-of-concerns as lib/ticTacToe.ts / lib/rps.ts.
 */
export const QUESTION_DURATION_MS = 12000;
export const QUESTIONS_PER_MATCH = 10;

const SPEED_POINTS_MIN = 40;
const SPEED_POINTS_MAX = 100;

/**
 * Points for one answer. `msTaken` MUST come from the server's own clock
 * (Date.now() at receipt, minus the stored currentQuestionStartedAt) —
 * never a client-reported elapsed time, or a player could claim an
 * instant answer. Correct-but-slow still floors at SPEED_POINTS_MIN
 * rather than 0 — this rewards speed AND accuracy, not speed alone.
 */
export function computeAnswerPoints(correct: boolean, msTaken: number): number {
  if (!correct) return 0;
  const clamped = Math.max(0, Math.min(msTaken, QUESTION_DURATION_MS));
  const speedRatio = 1 - clamped / QUESTION_DURATION_MS;
  return Math.round(SPEED_POINTS_MIN + (SPEED_POINTS_MAX - SPEED_POINTS_MIN) * speedRatio);
}

/** Podium rewards — the SAME real loyaltyPoints balance every other
 *  feature in this app earns/spends, not a second currency. Index 0/1/2
 *  = 1st/2nd/3rd; anyone else finishing gets the flat participation
 *  amount. */
export const PODIUM_REWARD_POINTS = [50, 30, 15] as const;
export const PARTICIPATION_REWARD_POINTS = 5;
