"use client";

import Link from "next/link";
import { Bike, Clock, QrCode, Sprout, Store } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import KhmerDivider from "@/components/KhmerDivider";
import HeroSlideshow from "@/components/HeroSlideshow";
import SayingBlock from "@/components/SayingBlock";
import { useLanguage } from "@/contexts/LanguageContext";
import { CULTURAL } from "@/lib/i18n";
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
  featuredProducts,
}: {
  featuredProducts: ProductDTO[];
}) {
  const { t } = useLanguage();

  return (
    <div>
      <HeroSlideshow />

      <section className="border-b border-gold-500/30 bg-cream-50 dark:bg-coffee-900">
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

      {/* Ancestral welcome — Royal Crimson Lacquer band */}
      <section className="kbach-overlay relative overflow-hidden bg-gradient-to-b from-crimson-600 to-crimson-700 text-cream-50">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-16 sm:px-6">
          <KhmerDivider className="text-gold-500" />
          <p className="font-heading text-lg text-gold-400">
            {t("welcome.greeting")}
          </p>
          <SayingBlock saying={CULTURAL.welcome} variant="light" size="lg" />
          <KhmerDivider className="text-gold-500" />
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-3xl text-coffee-900 dark:text-cream-50">
              {t("home.fanFavorites")}
            </h2>
            <p className="mt-1 text-coffee-500 dark:text-cream-300">
              {t("home.fanFavoritesSubtitle")}
            </p>
            <KhmerDivider className="mt-4" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/menu"
              className="text-sm font-semibold text-clay-500 hover:underline"
            >
              {t("home.viewFullMenu")} →
            </Link>
          </div>
        </section>
      )}

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
