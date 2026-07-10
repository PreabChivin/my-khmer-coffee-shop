/**
 * 💎 Loyalty Points Reward Program (សន្សំពិន្ទុ) — single source of truth for
 * the earn ratio and membership tiers. Points are credited once, when staff
 * mark an order COMPLETED (see the admin orders PATCH route).
 */

/** Earn ratio: $1 spent = 10 points. */
export const POINTS_PER_DOLLAR = 10;

/** Points earned for a given order total (rounded to the nearest point). */
export function pointsForAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * POINTS_PER_DOLLAR);
}

export interface LoyaltyTier {
  name: string;
  km: string;
  emoji: string;
  min: number; // lifetime points required to reach this tier
}

// Ascending by `min`. A customer's tier is the highest one whose `min` they meet.
export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: "Bronze", km: "សំរិទ្ធ", emoji: "🥉", min: 0 },
  { name: "Silver", km: "ប្រាក់", emoji: "🥈", min: 500 },
  { name: "Gold", km: "មាស", emoji: "🥇", min: 1500 },
  { name: "Diamond", km: "ពេជ្រ", emoji: "💎", min: 3000 },
];

export interface TierProgress {
  current: LoyaltyTier;
  next: LoyaltyTier | null;
  /** 0–100 progress toward `next` (100 when already at the top tier). */
  percent: number;
  /** Points still needed to reach `next` (0 at the top tier). */
  pointsToNext: number;
}

export function tierProgress(points: number): TierProgress {
  const pts = Math.max(0, Math.floor(points || 0));
  let current = LOYALTY_TIERS[0];
  let next: LoyaltyTier | null = null;

  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    if (pts >= LOYALTY_TIERS[i].min) {
      current = LOYALTY_TIERS[i];
      next = LOYALTY_TIERS[i + 1] ?? null;
    }
  }

  if (!next) {
    return { current, next: null, percent: 100, pointsToNext: 0 };
  }

  const span = next.min - current.min;
  const gained = pts - current.min;
  const percent = span > 0 ? Math.min(100, Math.round((gained / span) * 100)) : 0;
  return { current, next, percent, pointsToNext: Math.max(0, next.min - pts) };
}
