import type { ShopItemDTO } from "@/lib/types";

/** Shared rarity-tier accent color — used by the Avatar Shop grid cards
 *  and the public player-inspection card, so a rarity always reads the
 *  same color everywhere it appears. */
export const TIER_RING_CLASS: Record<ShopItemDTO["tier"], string> = {
  COMMON: "ring-coffee-300 dark:ring-coffee-600",
  RARE: "ring-lavender-400 dark:ring-lavender-500",
  EPIC: "ring-crimson-400 dark:ring-crimson-500",
  LEGENDARY: "ring-gold-500 dark:ring-gold-400",
};
