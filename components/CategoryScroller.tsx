"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { localizedCategory } from "@/lib/i18n";
import { playTick } from "@/lib/sfx";

const CATEGORY_EMOJI: Record<string, string> = {
  All: "🌈",
  Coffee: "☕",
  Tea: "🍵",
  Bakery: "🧁",
};

export default function CategoryScroller({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}) {
  const { lang, t } = useLanguage();
  const options = ["All", ...categories];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex gap-5 overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((category) => {
          const isActive = active === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => {
                playTick();
                onSelect(category);
              }}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-clay-300 to-crimson-300 ring-4 ring-clay-400"
                    : "bg-cream-100 ring-2 ring-transparent hover:ring-clay-200 dark:bg-coffee-800"
                }`}
              >
                <span className={isActive ? "animate-bounce-cute inline-block" : ""}>
                  {CATEGORY_EMOJI[category] ?? "✨"}
                </span>
              </span>
              <span
                className={`text-xs font-bold ${
                  isActive
                    ? "text-clay-600 dark:text-clay-400"
                    : "text-coffee-500 dark:text-cream-300"
                }`}
              >
                {category === "All" ? t("menu.categoryAll") : localizedCategory(category, lang)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
