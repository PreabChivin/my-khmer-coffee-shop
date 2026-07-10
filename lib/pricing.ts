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

/** Clamps a raw flat ($ off) discount into a safe non-negative amount. */
export function clampFlatDiscount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return round2(n);
}

/**
 * Price after applying a product's discounts. The percentage is applied
 * first, then the flat amount is subtracted, and the result is clamped so it
 * can never go below $0. Both default to 0 so a plain `computeDiscountedPrice(
 * price, percent)` call still behaves exactly as before.
 */
export function computeDiscountedPrice(
  price: number,
  discountPercent: number,
  flatDiscount: number = 0
): number {
  const pct = clampDiscountPercent(discountPercent);
  const flat = clampFlatDiscount(flatDiscount);
  const afterPercent = pct === 0 ? price : price * (1 - pct / 100);
  return round2(Math.max(0, afterPercent - flat));
}

/** ⭐ Average rating — guards against division by zero. */
export function computeAverageRating(
  ratingSum: number,
  ratingCount: number
): number {
  if (!ratingCount || ratingCount <= 0) return 0;
  return ratingSum / ratingCount;
}
