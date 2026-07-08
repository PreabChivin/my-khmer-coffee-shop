"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { STAMPS_PER_FREE_DRINK } from "@/lib/loyalty";

/** 🐻 Row of 6 stamp slots — filled bears show progress toward a free drink. */
export default function StampCard({
  stampsTowardNext,
  availableFreeDrinks,
}: {
  stampsTowardNext: number;
  availableFreeDrinks: number;
}) {
  const { t } = useLanguage();
  const filled = availableFreeDrinks > 0 ? STAMPS_PER_FREE_DRINK : stampsTowardNext;

  return (
    <div className="rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50 px-4 py-4 dark:border-clay-500 dark:bg-coffee-900/40">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-coffee-800 dark:text-cream-100">
          {t("loyalty.title")}
        </p>
        {availableFreeDrinks > 0 && (
          <span className="animate-pop-in rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-2.5 py-0.5 text-[11px] font-bold text-white">
            {t("loyalty.freeDrinkUnlocked")}
          </span>
        )}
      </div>

      <div className="mt-3 flex justify-between gap-1">
        {Array.from({ length: STAMPS_PER_FREE_DRINK }).map((_, i) => (
          <div
            key={i}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base transition-all ${
              i < filled
                ? "animate-pop-in border-gold-500 bg-gold-100"
                : "border-clay-200 bg-white/60 opacity-50 dark:bg-coffee-800"
            }`}
          >
            🐻
          </div>
        ))}
      </div>

      {availableFreeDrinks === 0 && (
        <p className="mt-2 text-center text-[11px] font-medium text-coffee-500 dark:text-cream-300">
          {STAMPS_PER_FREE_DRINK - stampsTowardNext} more to a free drink! ✨
        </p>
      )}
      {availableFreeDrinks > 1 && (
        <p className="mt-2 text-center text-[11px] font-medium text-coffee-500 dark:text-cream-300">
          {availableFreeDrinks}× free drinks available!
        </p>
      )}
    </div>
  );
}
