"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedDescription, localizedName } from "@/lib/i18n";
import type { ProductDTO } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductDTO }) {
  const { addItem } = useCart();
  const { lang, t } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);

  const name = localizedName(product, lang);
  const description = localizedDescription(product, lang);

  function handleAdd() {
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="khmer-card group flex flex-col overflow-hidden rounded-2xl bg-cream-50 transition-shadow hover:shadow-lg dark:bg-coffee-800">
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

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base text-coffee-900 dark:text-cream-50">
            {name}
          </h3>
          <span className="whitespace-nowrap font-semibold text-clay-500 dark:text-clay-400">
            ${product.price.toFixed(2)}
          </span>
        </div>
        {description && (
          <p className="mt-1 flex-1 text-sm text-coffee-500 dark:text-cream-300">
            {description}
          </p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.isAvailable}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold-500 py-2.5 text-sm font-semibold text-coffee-900 transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-coffee-200 disabled:text-coffee-400"
        >
          <Plus size={16} />
          {justAdded ? t("menu.added") : t("menu.addToCart")}
        </button>
      </div>
    </div>
  );
}
