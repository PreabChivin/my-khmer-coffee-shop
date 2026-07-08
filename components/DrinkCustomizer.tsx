"use client";

import { useState } from "react";
import { Coffee, Minus, Plus, Snowflake, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { localizedName } from "@/lib/i18n";
import { randomFortune, type Fortune } from "@/lib/fortunes";
import {
  BOBA_PRICE,
  EXTRA_SHOT_PRICE,
  MAX_SHOTS,
  SWEETNESS_LEVELS,
  ICE_LEVELS,
  allowsBoba,
  allowsShots,
  customizationSurcharge,
  defaultCustomization,
} from "@/lib/customization";
import { playBubble, playPop, playTick } from "@/lib/sfx";
import CupMixer from "@/components/CupMixer";
import type { DrinkCustomization, IceLevel, ProductDTO } from "@/lib/types";

interface DrinkCustomizerProps {
  product: ProductDTO;
  onConfirm: (customization: DrinkCustomization) => void;
  onClose: () => void;
}

const ICE_LABEL_KEY: Record<IceLevel, `customize.ice.${IceLevel}`> = {
  none: "customize.ice.none",
  less: "customize.ice.less",
  normal: "customize.ice.normal",
  extra: "customize.ice.extra",
};

export default function DrinkCustomizer({
  product,
  onConfirm,
  onClose,
}: DrinkCustomizerProps) {
  const { lang, t } = useLanguage();
  const [customization, setCustomization] = useState<DrinkCustomization>(
    () =>
      defaultCustomization(product.category) ?? {
        sweetness: 100,
        ice: "normal",
        shots: 0,
        boba: false,
      }
  );

  // 🔮 Daily Vibe Check — reveals a fortune AND injects it into the cart.
  const { setVibe } = useCart();
  const [fortune, setFortune] = useState<Fortune | null>(null);
  function shakeFortune() {
    playPop();
    const f = randomFortune();
    setFortune(f);
    setVibe(f);
  }

  const canAddShots = allowsShots(product.category);
  const canAddBoba = allowsBoba(product.category);
  const surcharge = customizationSurcharge(customization);
  const unitPrice = product.price + surcharge;
  const name = localizedName(product, lang);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-coffee-900/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="khmer-card relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-cream-50 dark:bg-coffee-800 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-gold-500/50 px-5 py-4">
          <div>
            <h2 className="khmer-heading-glow font-heading text-lg text-coffee-900 dark:text-cream-50">
              {t("customize.title")}
            </h2>
            <p className="text-sm text-coffee-500 dark:text-cream-300">{name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("customize.cancel")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-coffee-500 hover:bg-coffee-100 dark:text-cream-300 dark:hover:bg-coffee-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* 🥤 Visual Cup Mixer — live preview */}
          <CupMixer customization={customization} category={product.category} />

          {/* Sweetness */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-coffee-800 dark:text-cream-100">
              {t("customize.sweetness")}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {SWEETNESS_LEVELS.map((level) => {
                const active = customization.sweetness === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      playBubble();
                      setCustomization((c) => ({ ...c, sweetness: level }));
                    }}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
                      active
                        ? "border-gold-500 bg-coffee-800 text-gold-400"
                        : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                    }`}
                  >
                    {level}%
                  </button>
                );
              })}
            </div>
          </section>

          {/* Ice */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-coffee-800 dark:text-cream-100">
              <Snowflake size={15} className="text-clay-500" />
              {t("customize.ice")}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {ICE_LEVELS.map((level) => {
                const active = customization.ice === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      playBubble();
                      setCustomization((c) => ({ ...c, ice: level }));
                    }}
                    className={`rounded-xl border px-1 py-2.5 text-xs font-semibold transition-transform hover:scale-105 active:scale-95 ${
                      active
                        ? "border-gold-500 bg-coffee-800 text-gold-400"
                        : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                    }`}
                  >
                    {t(ICE_LABEL_KEY[level])}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 🧋 Boba topping */}
          {canAddBoba && (
            <section>
              <button
                type="button"
                onClick={() => {
                  playBubble();
                  setCustomization((c) => ({ ...c, boba: !c.boba }));
                }}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-95 ${
                  customization.boba
                    ? "border-clay-400 bg-clay-50 text-clay-600 dark:bg-coffee-900 dark:text-clay-400"
                    : "border-coffee-300 text-coffee-600 dark:border-coffee-600 dark:text-cream-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  🧋 {t("customize.boba")}
                  <span className="text-xs font-normal text-coffee-400 dark:text-cream-400">
                    +${BOBA_PRICE.toFixed(2)}
                  </span>
                </span>
                <span
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    customization.boba ? "bg-clay-400" : "bg-coffee-300 dark:bg-coffee-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      customization.boba ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            </section>
          )}

          {/* Extra espresso shots — espresso drinks only */}
          {canAddShots && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-coffee-800 dark:text-cream-100">
                <Coffee size={15} className="text-clay-500" />
                {t("customize.shots")}
                <span className="ml-1 text-xs font-normal text-coffee-400 dark:text-cream-400">
                  +${EXTRA_SHOT_PRICE.toFixed(2)} {t("customize.shotEach")}
                </span>
              </h3>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Fewer shots"
                  onClick={() => {
                    playTick();
                    setCustomization((c) => ({
                      ...c,
                      shots: Math.max(0, c.shots - 1),
                    }));
                  }}
                  disabled={customization.shots === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-coffee-300 text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-lg font-bold text-coffee-900 dark:text-cream-50">
                  {customization.shots}
                </span>
                <button
                  type="button"
                  aria-label="More shots"
                  onClick={() => {
                    playTick();
                    setCustomization((c) => ({
                      ...c,
                      shots: Math.min(MAX_SHOTS, c.shots + 1),
                    }));
                  }}
                  disabled={customization.shots >= MAX_SHOTS}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-coffee-300 text-coffee-700 transition-colors hover:bg-coffee-100 disabled:opacity-40 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            </section>
          )}

          {/* 🔮 The Destiny Cup fortune teller */}
          <section className="rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50 px-4 py-4 dark:border-clay-500 dark:bg-coffee-900/40">
            <button
              type="button"
              onClick={shakeFortune}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Sparkles size={16} />
              {lang === "km"
                ? "គ្រវីកែវទាយជតារាសី 🔮"
                : "Shake for Daily Vibe Check! 🔮"}
            </button>
            {fortune && (
              <div
                key={fortune.km}
                className="animate-pop-in mt-3 rounded-xl bg-white/80 px-4 py-3 text-center dark:bg-coffee-800/80"
              >
                <p className="text-3xl">{fortune.emoji}</p>
                <p className="mt-1 font-heading text-sm leading-relaxed text-coffee-800 dark:text-cream-50">
                  {lang === "km" ? fortune.km : fortune.en}
                </p>
                <button
                  type="button"
                  onClick={shakeFortune}
                  className="mt-2 text-xs font-semibold text-clay-600 underline dark:text-clay-400"
                >
                  {lang === "km" ? "ទាយម្ដងទៀត ✨" : "Shake again ✨"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Footer add button */}
        <div className="border-t border-coffee-200 px-5 py-4 dark:border-coffee-700">
          <button
            type="button"
            onClick={() => {
              playPop();
              onConfirm(customization);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold-500 py-3 font-bold text-coffee-900 shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus size={18} />
            {t("customize.addForPrefix")} · ${unitPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
