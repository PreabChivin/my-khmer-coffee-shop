"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedDescription, localizedName } from "@/lib/i18n";
import { isCustomizable } from "@/lib/customization";
import DrinkCustomizer from "@/components/DrinkCustomizer";
import GroupNamePromptModal from "@/components/GroupNamePromptModal";
import ApsaraChibi from "@/components/mascots/ApsaraChibi";
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

// Playful Gen-Z slang tags sprinkled onto menu cards. Picked deterministically
// per product (by id) so the server and client always render the same one — no
// hydration mismatch.
const SLANGS: { km: string; en: string }[] = [
  { km: "ពេញចិត្តស្តូក ⭐", en: "total fave ⭐" },
  { km: "ឆ្ងាញ់ម៉ៅដាច់ 🔥", en: "slaps hard 🔥" },
  { km: "ប្រូ/ស៊ីស ត្រូវសាក 💖", en: "bestie must-try 💖" },
];

function slangFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return SLANGS[sum % SLANGS.length];
}

export default function ProductCard({ product }: { product: ProductDTO }) {
  const { addItem } = useCart();
  const { isGroupMode, contributorName, setContributorName, addGroupItem } =
    useGroupCart();
  const { lang, t } = useLanguage();
  const [justAdded, setJustAdded] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingCustomization, setPendingCustomization] = useState<
    DrinkCustomization | null | undefined
  >(undefined);

  const name = localizedName(product, lang);
  const description = localizedDescription(product, lang);
  const customizable = isCustomizable(product.category);
  const slang = slangFor(product.id);

  function flashAdded() {
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  async function commitAdd(customization: DrinkCustomization | null) {
    if (isGroupMode) {
      if (!contributorName.trim()) {
        setPendingCustomization(customization);
        setShowNamePrompt(true);
        return;
      }
      const ok = await addGroupItem(product, 1, customization);
      if (ok) flashAdded();
      return;
    }
    addItem(product, customization ? { customization } : undefined);
    flashAdded();
  }

  function handleAdd() {
    if (customizable) {
      setShowCustomizer(true);
      return;
    }
    void commitAdd(null);
  }

  function handleConfirmCustomization(customization: DrinkCustomization) {
    setShowCustomizer(false);
    void commitAdd(customization);
  }

  function handleNameConfirmed(confirmedName: string) {
    setContributorName(confirmedName);
    setShowNamePrompt(false);
    void commitAdd(pendingCustomization ?? null);
    setPendingCustomization(undefined);
  }

  return (
    <div className="khmer-card group relative flex flex-col overflow-hidden rounded-3xl bg-cream-50 transition-shadow hover:shadow-lg dark:bg-coffee-800">
      {/* 👶✨ Baby Apsara dances when an item is added */}
      {justAdded && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-20 -translate-x-1/2">
          <ApsaraChibi hearts size={96} className="animate-apsara-dance" />
        </div>
      )}
      <div className="relative aspect-square w-full overflow-hidden bg-coffee-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* 💖 Playful slang badge */}
        {product.isAvailable && (
          <span className="absolute left-2 top-2 rounded-full bg-clay-400/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {lang === "km" ? slang.km : slang.en}
          </span>
        )}
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
          className="relative mt-4 flex items-center justify-center gap-2 rounded-full bg-gold-500 py-2.5 text-sm font-bold text-coffee-900 shadow-sm transition-transform hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-gold-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-coffee-200 disabled:text-coffee-400 disabled:hover:translate-y-0 disabled:hover:scale-100"
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

      {showNamePrompt && (
        <GroupNamePromptModal
          onConfirm={handleNameConfirmed}
          onClose={() => {
            setShowNamePrompt(false);
            setPendingCustomization(undefined);
          }}
        />
      )}
    </div>
  );
}
