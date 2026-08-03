"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedName } from "@/lib/i18n";
import { computeAverageRating, computeDiscountedPrice } from "@/lib/pricing";
import { hasAnyPromo } from "@/components/menu/PromoBadge";
import ProductImage from "@/components/ProductImage";
import type { ProductDTO } from "@/lib/types";

const MAX_SHOWCASE = 3;

/** Picks up to 3 REAL standout products (never invented content): top-rated
 *  first, then promo items, then partner items — deduped, available only. */
function pickShowcase(products: ProductDTO[]): ProductDTO[] {
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
      if (picks.length >= MAX_SHOWCASE) break;
      if (!seen.has(p.id)) {
        picks.push(p);
        seen.add(p.id);
      }
    }
  }
  return picks;
}

/** The real signal that earned this product a showcase spot — grounded in
 *  actual data (rating/promo/partner), never a fabricated "fresh" timestamp
 *  since this app has no such field to back that claim honestly. */
function chipFor(
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

/** 📸 Floating glassmorphic showcase strip layered inside the hero — a
 *  curated look at real standout products (not a marketing slide) with a
 *  status chip apiece. Tapping one scrolls straight to its spot in the full
 *  menu grid below; there's no per-product detail route in this app, so this
 *  intentionally reuses the existing #menu-grid anchor rather than inventing
 *  a new navigation target. */
export default function HeroProductShowcase({ products }: { products: ProductDTO[] }) {
  const { lang } = useLanguage();
  const router = useRouter();
  const showcase = useMemo(() => pickShowcase(products), [products]);

  if (showcase.length === 0) return null;

  function goToMenu() {
    router.push("/#menu-grid", { scroll: false });
    document.getElementById("menu-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="relative z-10 mt-2 flex w-full max-w-2xl gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {showcase.map((product) => {
        const name = localizedName(product, lang);
        const chip = chipFor(product, lang);
        const discounted = computeDiscountedPrice(
          product.price,
          product.discountPercent,
          product.flatDiscount
        );
        return (
          <button
            key={product.id}
            type="button"
            onClick={goToMenu}
            className="btn-tactile flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/40 bg-white/15 p-2 pr-4 text-left shadow-lg backdrop-blur-md"
          >
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <ProductImage src={product.image} alt={name} className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              {chip && (
                <span className="mb-0.5 flex items-center gap-1 text-[10px] font-extrabold text-gold-100">
                  {chip.emoji} {chip.label}
                </span>
              )}
              <span className="block max-w-[8rem] truncate text-sm font-bold text-white drop-shadow-sm">
                {name}
              </span>
              <span className="text-xs font-semibold text-white/85">
                ${discounted.toFixed(2)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
