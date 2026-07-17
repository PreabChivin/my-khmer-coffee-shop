"use client";

import type { ProductDTO } from "@/lib/types";

/** True when a product carries any promotional badge (percent, flat, or tag). */
export function hasAnyPromo(product: ProductDTO): boolean {
  return (
    product.discountPercent > 0 || product.flatDiscount > 0 || Boolean(product.promoTag)
  );
}

// Shared foodpanda-style badge chrome — vibrant, high-contrast, with a smooth
// lift-and-grow micro-animation driven by the parent card's `group` hover.
const BADGE_BASE =
  "animate-pop-in inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md ring-1 ring-white/30 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110";

/**
 * 🔖 Multi-tier promotional badges, foodpanda-style. Stacks every applicable
 * tag at the top-left of a product image:
 *   - Percentage discount  → foodpanda-pink
 *   - Flat ($) discount    → bright red
 *   - Conditional promo tag → vibrant purple→pink (e.g. "ទិញ 1 ថែម 1")
 */
export default function PromoBadge({ product }: { product: ProductDTO }) {
  const badges: React.ReactNode[] = [];

  if (product.discountPercent > 0) {
    badges.push(
      <span
        key="pct"
        className={`${BADGE_BASE} bg-gradient-to-r from-[#e21b70] to-[#ff4d94]`}
      >
        🔥 បញ្ចុះតម្លៃ {product.discountPercent}%
      </span>
    );
  }

  if (product.flatDiscount > 0) {
    badges.push(
      <span
        key="flat"
        className={`${BADGE_BASE} bg-gradient-to-r from-[#e8112d] to-[#ff5252]`}
      >
        💵 ចុះតម្លៃ ${product.flatDiscount.toFixed(2)}
      </span>
    );
  }

  if (product.promoTag) {
    badges.push(
      <span
        key="tag"
        className={`${BADGE_BASE} bg-gradient-to-r from-[#8a2be2] to-[#e21b70]`}
      >
        ⚡ {product.promoTag}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
      {badges}
    </div>
  );
}
