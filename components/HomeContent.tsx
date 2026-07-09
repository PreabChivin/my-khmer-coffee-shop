"use client";

import { useMemo, useState } from "react";
import { Bike, Clock, QrCode, Sprout, Store } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSlideshow from "@/components/HeroSlideshow";
import PromoBannerCarousel from "@/components/PromoBannerCarousel";
import CategoryScroller from "@/components/CategoryScroller";
import HomeSidebar from "@/components/HomeSidebar";
import StaffKitchenView from "@/components/StaffKitchenView";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import type { ProductDTO } from "@/lib/types";
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
}: {
  initialProducts: ProductDTO[];
}) {
  const { t } = useLanguage();
  const { isAdmin } = useAdminSession();
  const [products, setProducts] = useState(initialProducts);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) if (!seen.includes(p.category)) seen.push(p.category);
    return seen;
  }, [products]);

  const visibleProducts = useMemo(
    () =>
      activeCategory === "All"
        ? products
        : products.filter((p) => p.category === activeCategory),
    [products, activeCategory]
  );

  function handleProductCreated(created: ProductDTO) {
    setProducts((prev) => [...prev, created]);
  }
  function handleProductUpdated(updated: ProductDTO) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }
  function handleProductDeleted(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // Note: the customer view renders immediately by default (matching SSR
  // output, so every visitor gets instant content with no loading flash).
  // A returning staff session flips to the Staff view a moment later, once
  // the client-side session check resolves — a brief, harmless flash of
  // public menu content for the rare staff reload beats a loading spinner
  // for 100% of customer traffic.

  // 🧑‍🍳 Strict world separation: logging in swaps the ENTIRE main viewport
  // to the Staff Kitchen View. No customer banners, menu grid, or cart.
  if (isAdmin) {
    return (
      <StaffKitchenView
        products={products}
        onProductCreated={handleProductCreated}
        onProductUpdated={handleProductUpdated}
        onProductDeleted={handleProductDeleted}
      />
    );
  }

  return (
    <div>
      <HeroSlideshow />

      {/* 🎉 Top Promotional Banner Carousel */}
      <PromoBannerCarousel />

      {/* 🍩 Categorized horizontal menu scroller */}
      <CategoryScroller
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Two-column Foodpanda-style layout: sidebar + product grid */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <HomeSidebar />

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
