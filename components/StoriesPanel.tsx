"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedDescription, localizedName } from "@/lib/i18n";
import { computeDiscountedPrice } from "@/lib/pricing";
import { hasAnyPromo } from "@/components/PromoBadge";
import ProductImage from "@/components/ProductImage";
import type { ProductDTO } from "@/lib/types";

const MAX_STORIES = 10;

/** 📸 Home Screen Stories/Highlights — an IG-style horizontal scroller of
 *  gradient-ringed circles. Deliberately sourced from REAL product data
 *  (promo/partner items already in ProductDTO), not placeholder content —
 *  no new schema, no new endpoint, purely a presentation-layer read of data
 *  the storefront already fetches. Tapping a bubble opens a lightweight
 *  highlight card with the same promo info MenuGrid already shows. */
export default function StoriesPanel({ products }: { products: ProductDTO[] }) {
  const { lang, t } = useLanguage();
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [activeProduct, setActiveProduct] = useState<ProductDTO | null>(null);

  const stories = useMemo(() => {
    const spotlighted = products.filter((p) => hasAnyPromo(p) || p.isPartner);
    return spotlighted.slice(0, MAX_STORIES);
  }, [products]);

  useEffect(() => {
    if (!activeProduct) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveProduct(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProduct]);

  if (stories.length === 0) return null;

  function openStory(product: ProductDTO) {
    setSeenIds((prev) => new Set(prev).add(product.id));
    setActiveProduct(product);
  }

  const discountedPrice = activeProduct
    ? computeDiscountedPrice(
        activeProduct.price,
        activeProduct.discountPercent,
        activeProduct.flatDiscount
      )
    : 0;

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stories.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => openStory(product)}
              className="btn-tactile flex shrink-0 flex-col items-center gap-1.5"
              style={{ width: 68 }}
            >
              <span
                className={`story-ring flex h-16 w-16 items-center justify-center rounded-full p-[3px] ${
                  seenIds.has(product.id) ? "story-ring-seen" : ""
                }`}
              >
                <span className="h-full w-full overflow-hidden rounded-full border-2 border-cream-50 bg-cream-100 dark:border-coffee-900 dark:bg-coffee-800">
                  <ProductImage
                    src={product.image}
                    alt={localizedName(product, lang)}
                    className="h-full w-full object-cover"
                  />
                </span>
              </span>
              <span className="line-clamp-1 w-full text-center text-[10px] font-bold text-coffee-700 dark:text-cream-200">
                {localizedName(product, lang)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeProduct && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="glass-card-premium animate-pop-in relative w-full max-w-xs overflow-hidden rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveProduct(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-coffee-900/50 text-white backdrop-blur-sm"
            >
              <X size={16} />
            </button>
            <ProductImage
              src={activeProduct.image}
              alt={localizedName(activeProduct, lang)}
              className="h-48 w-full object-cover"
            />
            <div className="p-4">
              {activeProduct.promoTag && (
                <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-[#8a2be2] to-[#e21b70] px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md">
                  ⚡ {activeProduct.promoTag}
                </span>
              )}
              <h3 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
                {localizedName(activeProduct, lang)}
              </h3>
              {localizedDescription(activeProduct, lang) && (
                <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
                  {localizedDescription(activeProduct, lang)}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                {discountedPrice < activeProduct.price ? (
                  <>
                    <span className="text-lg font-extrabold text-crimson-600 dark:text-crimson-400">
                      ${discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-coffee-400 line-through dark:text-cream-400">
                      ${activeProduct.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-extrabold text-coffee-900 dark:text-cream-50">
                    ${activeProduct.price.toFixed(2)}
                  </span>
                )}
              </div>
              {activeProduct.isPartner && activeProduct.partnerName && (
                <p className="mt-2 text-xs font-semibold text-lavender-500">
                  🤝 {t("menu.partnerWith")}: {activeProduct.partnerName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
