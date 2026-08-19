/**
 * 💎 Arcade Points (formerly "Loyalty Points") — single source of truth for
 * membership tiers, still backed by `User.loyaltyPoints`. Earned by playing
 * games and completing daily missions (see `lib/missions.ts`,
 * `lib/missionProgress.ts`) and spent in the Avatar Studio
 * (`lib/shopPurchase.ts`). The historical `pointsForAmount`/order-completion
 * earning path was removed along with the ordering system it depended on.
 */

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
