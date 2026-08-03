import { computeAverageRating } from "@/lib/pricing";
import { hasAnyPromo } from "@/components/menu/PromoBadge";
import type { ProductDTO } from "@/lib/types";

/** Picks up to `max` REAL standout products (never invented content):
 *  top-rated first, then promo items, then partner items — deduped,
 *  available only. Shared by HeroProductShowcase and PetZoo (Bong Bear's
 *  host recommendation) so "what counts as a standout" never drifts. */
export function pickSpotlightProducts(products: ProductDTO[], max: number): ProductDTO[] {
  const available = products.filter((p) => p.isAvailable);
  const rated = [...available]
    .filter((p) => p.ratingCount > 0)
    .sort(
      (a, b) =>
        computeAverageRating(b.ratingSum, b.ratingCount) -
        computeAverageRating(a.ratingSum, a.ratingCount)
    );
  const promo = available.filter((p) => hasAnyPromo(p));
  const partner = available.filter((p) => p.isPartner);

  const picks: ProductDTO[] = [];
  const seen = new Set<string>();
  for (const list of [rated, promo, partner]) {
    for (const p of list) {
      if (picks.length >= max) break;
      if (!seen.has(p.id)) {
        picks.push(p);
        seen.add(p.id);
      }
    }
  }
  return picks;
}

/** The real signal that earned a product its spotlight — grounded in actual
 *  data (rating/promo/partner), never a fabricated "fresh" timestamp since
 *  ProductDTO has no field to back that claim honestly. */
export function spotlightChipFor(
  product: ProductDTO,
  lang: "en" | "km"
): { emoji: string; label: string } | null {
  const avg = computeAverageRating(product.ratingSum, product.ratingCount);
  if (product.ratingCount > 0 && avg >= 4.995) {
    return { emoji: "🔥", label: lang === "km" ? "គេពេញនិយម" : "Top Voted" };
  }
  if (hasAnyPromo(product)) {
    return { emoji: "⚡", label: lang === "km" ? "បញ្ចុះតម្លៃ" : "On Sale" };
  }
  if (product.isPartner) {
    return { emoji: "🤝", label: lang === "km" ? "ដៃគូ" : "Partner" };
  }
  return null;
}
