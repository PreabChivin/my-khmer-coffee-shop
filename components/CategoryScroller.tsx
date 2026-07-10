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

  // One consistent, fixed-width tile per category so the icons and labels
  // stay perfectly aligned in a row regardless of label length.
  function renderTile(id: string, label: string, icon: React.ReactNode) {
    const isActive = activeId === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => select(id)}
        aria-pressed={isActive}
        className="flex w-[4.75rem] shrink-0 snap-start select-none flex-col items-center gap-1.5 outline-none"
      >
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-sm transition-all ${
            isActive
              ? "bg-gradient-to-br from-clay-300 to-crimson-300 ring-4 ring-clay-400"
              : "bg-cream-100 ring-2 ring-transparent hover:ring-clay-200 dark:bg-coffee-800"
          }`}
        >
          <span className={isActive ? "animate-bounce-cute inline-flex" : "inline-flex"}>
            {icon}
          </span>
        </span>
        <span
          className={`w-full truncate text-center text-xs font-bold ${
            isActive
              ? "text-clay-600 dark:text-clay-400"
              : "text-coffee-500 dark:text-cream-300"
          }`}
        >
          {label}
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex snap-x gap-4 overflow-x-auto scroll-px-4 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {renderTile(ALL_CATEGORIES_ID, t("menu.categoryAll"), <span>🌈</span>)}
        {categories.map((category) =>
          renderTile(
            category.id,
            localizedCategory(category.name, lang),
            <CategoryIcon
              category={category}
              size={30}
              className={activeId === category.id ? "text-crimson-600" : "text-clay-500"}
            />
          )
        )}
      </div>
    </div>
  );
}
