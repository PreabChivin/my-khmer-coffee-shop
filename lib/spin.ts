/** 🎡 Daily Lucky Spin — one free spin per calendar day, credited straight
 *  onto the same `User.loyaltyPoints` balance missions/games use. The
 *  once-per-day guard reuses `UserMissionProgress` (see
 *  app/api/spin/route.ts) keyed by this dedicated missionKey — it never
 *  appears in lib/missions.ts's MISSIONS list, since the spin has its own
 *  widget/endpoint rather than living in the Missions panel. */
export const SPIN_MISSION_KEY = "daily_spin";

/** The 6 wedges shown on the wheel — also the only values rollSpinPrize()
 *  can return, so the wheel always visually lands on the real prize. */
export const SPIN_SEGMENTS = [5, 10, 15, 20, 30, 50] as const;
export type SpinPrize = (typeof SPIN_SEGMENTS)[number];

// Weighted toward small prizes by repeating them more — no separate weight
// field needed, just duplicate entries.
const PRIZE_WEIGHTS: SpinPrize[] = [5, 5, 5, 10, 10, 10, 15, 15, 20, 20, 30, 50];

export function rollSpinPrize(): SpinPrize {
  return PRIZE_WEIGHTS[Math.floor(Math.random() * PRIZE_WEIGHTS.length)];
}
