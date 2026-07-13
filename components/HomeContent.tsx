"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Clock, QrCode, Sprout, Store } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import PromoBannerCarousel from "@/components/PromoBannerCarousel";
import CategoryScroller, { ALL_CATEGORIES_ID } from "@/components/CategoryScroller";
import HomeSidebar from "@/components/HomeSidebar";
import WelcomePopup from "@/components/WelcomePopup";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSession } from "@/contexts/SessionContext";
import type { CategoryDTO, ProductDTO } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

const FEATURES: {
  icon: typeof Sprout;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    icon: Sprout,
    titleKey: "home.feature1Title",
    descKey: "home.feature1Desc",
  },
  {
    icon: QrCode,
    titleKey: "home.feature2Title",
    descKey: "home.feature2Desc",
  },
  {
    icon: Bike,
    titleKey: "home.feature3Title",
    descKey: "home.feature3Desc",
  },
];

export default function HomeContent({
  initialProducts,
  initialCategories,
}: {
  initialProducts: ProductDTO[];
  initialCategories: CategoryDTO[];
}) {
  const { t } = useLanguage();
  const { isStaff } = useSession();
  const router = useRouter();
  const [products] = useState(initialProducts);
  const [categories] = useState(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORIES_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleProducts = useMemo(() => {
    // 🔍 A hero search query searches every category at once; otherwise fall
    // back to the category scroller's selection.
    if (normalizedQuery) {
      return products.filter((p) =>
        [p.nameEn, p.nameKh, p.descriptionEn, p.descriptionKh]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(normalizedQuery))
      );
    }
    return activeCategoryId === ALL_CATEGORIES_ID
      ? products
      : products.filter((p) => p.categoryId === activeCategoryId);
  }, [products, activeCategoryId, normalizedQuery]);

  // 🧑‍🍳 The Staff/Admin dashboard now lives at its own /admin route (not
  // inline here). This is just a safety net for a stray staff session
  // landing on the storefront directly (e.g. a stale bookmark) — login
  // itself already redirects straight to /admin.
  useEffect(() => {
    if (isStaff) router.replace("/admin");
  }, [isStaff, router]);

  if (isStaff) return null;

  return (
    <div>
      {/* 🎉 First-visit registration promo (unauth guests only, shown once) */}
      <WelcomePopup />

      <HeroSlideshow searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* 🎉 Top Promotional Banner Carousel */}
      <PromoBannerCarousel />

      {/* 🍩 Categorized horizontal menu scroller */}
      <CategoryScroller
        categories={categories}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      {/* Two-column Foodpanda-style layout: sidebar + product grid */}
      <section id="menu-grid" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <HomeSidebar />

          <div className="min-w-0 flex-1">
            {normalizedQuery && visibleProducts.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-coffee-300 px-6 py-10 text-center text-coffee-500 dark:border-coffee-600 dark:text-cream-300">
                {t("menu.noResults")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-gold-500/30 bg-cream-50 dark:bg-coffee-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {FEATURES.map((feature) => (
            <div key={feature.titleKey} className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-clay-50 text-clay-500 dark:bg-coffee-800">
                <feature.icon size={22} />
              </span>
              <div>
                <h3 className="font-semibold text-coffee-900 dark:text-cream-50">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm text-coffee-500 dark:text-cream-300">
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cutie welcome — pastel vibe band */}
      <section className="kbach-overlay relative overflow-hidden bg-gradient-to-br from-clay-400 via-crimson-400 to-clay-500 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <div className="animate-bounce-cute text-5xl">🧋💖</div>
          <p className="font-heading text-2xl font-extrabold drop-shadow-sm sm:text-3xl">
            {t("welcome.greeting")}
          </p>
          <p className="max-w-md text-sm font-medium text-white/90">
            {t("welcome.subtitle")}
          </p>
        </div>
      </section>

      <section className="kbach-overlay bg-clay-500 text-cream-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/60 bg-clay-600">
              <Clock size={26} />
            </span>
            <div>
              <p className="text-sm uppercase tracking-widest text-gold-400">
                {t("home.storeHours")}
              </p>
              <p className="text-lg font-semibold">{t("home.hoursWeekday")}</p>
              <p className="text-lg font-semibold">{t("home.hoursWeekend")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/60 bg-clay-600">
              <Store size={26} />
            </span>
            <div className="text-left">
              <p className="text-sm uppercase tracking-widest text-gold-400">
                {t("home.visitUs")}
              </p>
              <p className="text-lg font-semibold">{t("home.address")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
