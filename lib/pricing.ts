/** 🔥 Dynamic Discount System — single source of truth for discount math,
 *  used both for display (client) and price calculation (server, checkout). */

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamps a raw discount percent into a safe 0–100 integer range. */
export function clampDiscountPercent(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}

/** Price after applying a product's discount percent (0 = no discount). */
export function computeDiscountedPrice(
  price: number,
  discountPercent: number
): number {
  const pct = clampDiscountPercent(discountPercent);
  if (pct === 0) return round2(price);
  return round2(price * (1 - pct / 100));
}

/** ⭐ Average rating — guards against division by zero. */
export function computeAverageRating(
  ratingSum: number,
  ratingCount: number
): number {
  if (!ratingCount || ratingCount <= 0) return 0;
  return ratingSum / ratingCount;
}
