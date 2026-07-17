"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/menu/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import type { RecommendationDTO } from "@/lib/types";

const REASON_LABEL_KEY: Record<RecommendationDTO["reason"], TranslationKey> = {
  "your-usual": "account.recommendedYourUsual",
  "popular-in-category": "account.recommendedCategory",
  "popular-overall": "account.recommendedPopular",
};

/** ✨ "Recommended for you" — a heuristic over the member's own order
 *  history (see GET /api/recommendations), NOT a trained model. Renders
 *  nothing if the account has no eligible picks, so it never leaves an
 *  empty section on the page. */
export default function RecommendationsCard() {
  const { t } = useLanguage();
  const [picks, setPicks] = useState<RecommendationDTO[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/recommendations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RecommendationDTO[]) => {
        if (!cancelled) setPicks(data);
      })
      .catch(() => {
        if (!cancelled) setPicks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!picks || picks.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
        {t("account.recommendedTitle")}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((pick) => (
          <div key={pick.product.id}>
            <span className="mb-1.5 inline-block rounded-full bg-lavender-100 px-2.5 py-1 text-[11px] font-bold text-lavender-700 dark:bg-coffee-800 dark:text-lavender-300">
              {t(REASON_LABEL_KEY[pick.reason])}
            </span>
            <ProductCard product={pick.product} />
          </div>
        ))}
      </div>
    </div>
  );
}
