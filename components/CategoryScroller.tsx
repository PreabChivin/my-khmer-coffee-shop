"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { localizedCategory } from "@/lib/i18n";
import { playTick } from "@/lib/sfx";
import CategoryIcon from "@/components/CategoryIcon";
import type { CategoryDTO } from "@/lib/types";

export const ALL_CATEGORIES_ID = "All";

export default function CategoryScroller({
  categories,
  activeId,
  onSelect,
}: {
  categories: CategoryDTO[];
  activeId: string;
  onSelect: (categoryId: string) => void;
}) {
  const { lang, t } = useLanguage();

  function select(id: string) {
    playTick();
    onSelect(id);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex gap-5 overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => select(ALL_CATEGORIES_ID)}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-sm transition-all ${
              activeId === ALL_CATEGORIES_ID
                ? "bg-gradient-to-br from-clay-300 to-crimson-300 ring-4 ring-clay-400"
                : "bg-cream-100 ring-2 ring-transparent hover:ring-clay-200 dark:bg-coffee-800"
            }`}
          >
            <span className={activeId === ALL_CATEGORIES_ID ? "animate-bounce-cute inline-block" : ""}>
              🌈
            </span>
          </span>
          <span
            className={`text-xs font-bold ${
              activeId === ALL_CATEGORIES_ID
                ? "text-clay-600 dark:text-clay-400"
                : "text-coffee-500 dark:text-cream-300"
            }`}
          >
            {t("menu.categoryAll")}
          </span>
        </button>

        {categories.map((category) => {
          const isActive = activeId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => select(category.id)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full shadow-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-clay-300 to-crimson-300 ring-4 ring-clay-400"
                    : "bg-cream-100 ring-2 ring-transparent hover:ring-clay-200 dark:bg-coffee-800"
                }`}
              >
                <span className={isActive ? "animate-bounce-cute inline-block" : "inline-block"}>
                  <CategoryIcon
                    category={category}
                    size={30}
                    className={isActive ? "text-crimson-600" : "text-clay-500"}
                  />
                </span>
              </span>
              <span
                className={`text-xs font-bold ${
                  isActive ? "text-clay-600 dark:text-clay-400" : "text-coffee-500 dark:text-cream-300"
                }`}
              >
                {localizedCategory(category.name, lang)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
