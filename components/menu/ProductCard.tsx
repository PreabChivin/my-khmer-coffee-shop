"use client";

import { useState } from "react";
import { Check, Plus, SlidersHorizontal, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedDescription, localizedName } from "@/lib/i18n";
import { isCustomizable } from "@/lib/customization";
import { computeAverageRating, computeDiscountedPrice } from "@/lib/pricing";
import DrinkCustomizer from "@/components/menu/DrinkCustomizer";
import GroupNamePromptModal from "@/components/cart/GroupNamePromptModal";
import ProductImage from "@/components/ProductImage";
import PromoBadge, { hasAnyPromo } from "@/components/menu/PromoBadge";
import ApsaraChibi from "@/components/mascots/ApsaraChibi";
import { playPop } from "@/lib/sfx";
import type { DrinkCustomization, ProductDTO } from "@/lib/types";

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

  // 🔥 Multi-tier Discount System — percent + flat both reduce the price;
  // promoTag is a cosmetic badge only.
  const discountedPrice = computeDiscountedPrice(
    product.price,
    product.discountPercent,
    product.flatDiscount
  );
  const hasPriceCut = discountedPrice < product.price;
  const hasPromo = hasAnyPromo(product);

  // ⭐ Rating aggregate — guarded against division by zero.
  const avgRating = computeAverageRating(product.ratingSum, product.ratingCount);
  const hasRatings = product.ratingCount > 0;
  const isPerfectScore = hasRatings && avgRating >= 4.995;

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
    playPop();
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
    <div className="khmer-card card-neon group relative flex flex-col overflow-hidden rounded-3xl bg-cream-50 dark:bg-coffee-800">
      {/* 👶✨ Baby Apsara dances when an item is added */}
      {justAdded && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 z-20 -translate-x-1/2">
          <ApsaraChibi hearts size={96} className="animate-apsara-dance" />
        </div>
      )}
      <div className="relative aspect-square w-full overflow-hidden bg-coffee-100">
        <ProductImage
          src={product.image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* 🌇 Bottom scrim — a full-bleed gradient so floating chips/the FAB
            stay legible directly over the photo, editorial-app style. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-coffee-950/70 to-transparent" />

        {/* 🔖 Foodpanda-style promo badges take priority over the slang badge */}
        {product.isAvailable && hasPromo && <PromoBadge product={product} />}
        {/* 💖 Playful slang badge — only when there's no promo to show */}
        {product.isAvailable && !hasPromo && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-clay-400/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {lang === "km" ? slang.km : slang.en}
          </span>
        )}
        {/* 🤝 Partner Integration badge */}
        {product.isPartner && (
          <span className="absolute right-2 top-2 rounded-full bg-matcha-500/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {product.partnerName ? `🤝 ${product.partnerName}` : t("product.partnerBadge")}
          </span>
        )}
        {/* 🔥 Floating status chip — real signal only (rating-based), sits on
            the scrim at the bottom-left, foodpanda/Uber-Eats style. */}
        {isPerfectScore && (
          <span className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-gold-500/95 px-2.5 py-1 text-[11px] font-extrabold text-coffee-900 shadow-sm">
            🔥 Top Voted
          </span>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-clay-400/70 backdrop-blur-[2px]">
            <span className="text-3xl">🧸</span>
            <span className="rounded-full bg-white px-4 py-1.5 text-center text-xs font-bold text-clay-600 shadow-sm">
              {t("menu.outOfStock")}
            </span>
          </div>
        )}

        {/* ➕ Floating quick-add FAB — breaks out over the bottom-right corner
            of the photo into the info panel below, the single add-to-cart
            control for this card (replaces the old full-width button). Spring
            overshoot on tap via .fab-spring; a checkmark flashes on success. */}
        {product.isAvailable && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={justAdded ? t("menu.added") : t("menu.addToCart")}
            className="fab-spring absolute -bottom-4 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-clay-500 text-coffee-900 shadow-lg ring-4 ring-cream-50 hover:scale-110 active:scale-90 dark:ring-coffee-800"
          >
            {justAdded ? (
              <Check size={18} />
            ) : customizable ? (
              <SlidersHorizontal size={16} />
            ) : (
              <Plus size={20} />
            )}
          </button>
        )}
      </div>

      <div className="glass-card-premium relative flex flex-1 flex-col rounded-b-3xl p-4 pt-5">
        <div className="relative flex items-start justify-between gap-2 pr-10">
          <h3 className="font-heading text-base text-coffee-900 dark:text-cream-50">
            {name}
          </h3>
          {hasPriceCut ? (
            <span className="flex shrink-0 flex-col items-end whitespace-nowrap">
              <span className="text-xs text-coffee-400 line-through dark:text-cream-400">
                ${product.price.toFixed(2)}
              </span>
              <span className="font-bold text-crimson-500 dark:text-crimson-400">
                ${discountedPrice.toFixed(2)}
              </span>
            </span>
          ) : (
            <span className="whitespace-nowrap font-semibold text-clay-500 dark:text-clay-400">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* ⭐ Live rating — hidden until the product has at least one rating */}
        {hasRatings && (
          <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-coffee-700 dark:text-cream-200">
            <Star size={13} className="fill-gold-500 text-gold-500 drop-shadow-[0_0_3px_rgba(255,195,46,0.6)]" />
            {avgRating.toFixed(1)}
            <span className="font-medium text-coffee-400 dark:text-cream-400">
              ({product.ratingCount}+)
            </span>
          </div>
        )}

        {/* 🍯🧊 Inline customization preview — a decorative hint only; the
            real sweetness/ice selection still happens in DrinkCustomizer
            (opened by the FAB above) so checkout pricing/logic is untouched. */}
        {customizable && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="rounded-full bg-clay-50 px-2 py-0.5 text-[10px] font-bold text-clay-600 dark:bg-coffee-900 dark:text-clay-400">
              🍯 {lang === "km" ? "ភាពផ្អែម" : "Sweetness"}
            </span>
            <span className="rounded-full bg-clay-50 px-2 py-0.5 text-[10px] font-bold text-clay-600 dark:bg-coffee-900 dark:text-clay-400">
              🧊 {lang === "km" ? "ទឹកកក" : "Ice"}
            </span>
          </div>
        )}

        {description && (
          <p className="relative mt-1 flex-1 text-sm text-coffee-500 dark:text-cream-300">
            {description}
          </p>
        )}
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
