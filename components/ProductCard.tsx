"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedDescription, localizedName } from "@/lib/i18n";
import { isCustomizable } from "@/lib/customization";
import DrinkCustomizer from "@/components/DrinkCustomizer";
import type { DrinkCustomization, ProductDTO } from "@/lib/types";

/**
 * Faint five-tower Angkor Wat silhouette that fades in along the lower edge of
 * a product card on hover — a subtle nod to Khmer heritage without competing
 * with the product photo.
 */
function AngkorSilhouette() {
  return (
    <svg
      viewBox="0 0 240 60"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-gold-500 opacity-0 transition-opacity duration-500 group-hover:opacity-15"
    >
      <path
        fill="currentColor"
        d="M0 60 V52 H12 L18 40 L22 30 L26 40 L32 52 H44 L50 34 L56 20 L62 34 L68 52 H84 L92 24 L104 6 L110 0 L116 6 L128 24 L136 52 H152 L158 34 L164 20 L170 34 L176 52 H188 L194 40 L198 30 L202 40 L208 52 H240 V60 Z"
      />
    </svg>
  );
}

export default function ProductCard({ product }: { product: ProductDTO }) {
  const { addItem } = useCart();
  const { lang, t } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const name = localizedName(product, lang);
  const description = localizedDescription(product, lang);
  const customizable = isCustomizable(product.category);

  function flashAdded() {
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function handleAdd() {
    if (customizable) {
      setShowCustomizer(true);
      return;
    }
    addItem(product);
    flashAdded();
  }

  function handleConfirmCustomization(customization: DrinkCustomization) {
    addItem(product, { customization });
    setShowCustomizer(false);
    flashAdded();
  }

  return (
    <div className="khmer-card group relative flex flex-col overflow-hidden rounded-2xl bg-cream-50 transition-shadow hover:shadow-lg dark:bg-coffee-800">
      <div className="relative aspect-square w-full overflow-hidden bg-coffee-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-coffee-900/60">
            <span className="rounded-full bg-cream-50 px-4 py-1.5 text-sm font-semibold text-coffee-900">
              {t("menu.outOfStock")}
            </span>
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col p-4">
        <AngkorSilhouette />
        <div className="relative flex items-start justify-between gap-2">
          <h3 className="font-heading text-base text-coffee-900 dark:text-cream-50">
            {name}
          </h3>
          <span className="whitespace-nowrap font-semibold text-clay-500 dark:text-clay-400">
            ${product.price.toFixed(2)}
          </span>
        </div>
        {description && (
          <p className="relative mt-1 flex-1 text-sm text-coffee-500 dark:text-cream-300">
            {description}
          </p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.isAvailable}
          className="relative mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold-500 py-2.5 text-sm font-semibold text-coffee-900 transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-coffee-200 disabled:text-coffee-400"
        >
          {customizable ? <SlidersHorizontal size={16} /> : <Plus size={16} />}
          {justAdded ? t("menu.added") : t("menu.addToCart")}
        </button>
      </div>

      {showCustomizer && (
        <DrinkCustomizer
          product={product}
          onConfirm={handleConfirmCustomization}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}
