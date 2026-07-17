"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import ProductCard from "@/components/menu/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedCategory } from "@/lib/i18n";
import type { ProductDTO } from "@/lib/types";

export default function MenuGrid({ products }: { products: ProductDTO[] }) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const isBrowsing = normalizedQuery === "";

  // Categories in first-seen order (products arrive grouped by category).
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) {
      if (!seen.includes(p.category)) seen.push(p.category);
    }
    return seen;
  }, [products]);

  const grouped = useMemo(() => {
    const map: Record<string, ProductDTO[]> = {};
    for (const c of categories) map[c] = [];
    for (const p of products) map[p.category]?.push(p);
    return map;
  }, [products, categories]);

  const searchResults = useMemo(() => {
    if (isBrowsing) return [];
    return products.filter((p) =>
      [p.nameEn, p.nameKh, p.descriptionEn, p.descriptionKh]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(normalizedQuery))
    );
  }, [products, normalizedQuery, isBrowsing]);

  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  // Suppress observer updates while a click-triggered smooth scroll runs, so
  // the tapped category stays highlighted until the scroll settles.
  const isClickScrolling = useRef(false);

  useEffect(() => {
    if (!isBrowsing) return; // sections aren't rendered while searching
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        const cat = visible[0]?.target.getAttribute("data-category");
        if (cat) setActiveCategory(cat);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );

    categories.forEach((c) => {
      const el = sectionRefs.current[c];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories, isBrowsing]);

  function scrollToCategory(category: string) {
    setActiveCategory(category);
    isClickScrolling.current = true;
    sectionRefs.current[category]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      isClickScrolling.current = false;
    }, 700);
  }

  return (
    <div>
      {/* Menu search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("menu.searchPlaceholder")}
          className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-3 pl-11 pr-11 text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-coffee-400 hover:bg-coffee-100 dark:hover:bg-coffee-700"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!isBrowsing ? (
        /* Search results mode */
        searchResults.length === 0 ? (
          <p className="py-16 text-center text-coffee-400 dark:text-cream-400">
            {t("menu.noResults")}
          </p>
        ) : (
          <div>
            <p className="mb-6 text-sm text-coffee-500 dark:text-cream-300">
              {searchResults.length} {t("menu.resultsWord")}
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-coffee-400 dark:text-cream-400">
          {t("menu.noItems")}
        </p>
      ) : (
        /* Browse mode: Foodpanda-style sticky category nav + sections */
        <>
          <div className="sticky top-[68px] z-30 -mx-4 mb-10 border-y border-gold-500/40 bg-cream-50/95 px-4 py-3 backdrop-blur dark:bg-coffee-900/95 sm:-mx-6 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => scrollToCategory(category)}
                  className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
                    activeCategory === category
                      ? "border-gold-500 bg-coffee-800 text-gold-400"
                      : "border-transparent bg-coffee-100 text-coffee-700 hover:bg-coffee-200 dark:bg-coffee-800 dark:text-cream-200 dark:hover:bg-coffee-700"
                  }`}
                >
                  {localizedCategory(category, lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-14">
            {categories.map((category) => (
              <section
                key={category}
                data-category={category}
                ref={(el) => {
                  sectionRefs.current[category] = el;
                }}
                className="scroll-mt-[150px]"
              >
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-heading text-2xl text-coffee-900 dark:text-cream-50">
                    {localizedCategory(category, lang)}
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-r from-gold-500/70 to-transparent" />
                  <span className="rounded-full bg-crimson-500/10 px-2.5 py-0.5 text-xs font-semibold text-crimson-500 dark:text-crimson-400">
                    {grouped[category].length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[category].map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
