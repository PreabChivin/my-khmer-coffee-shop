"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import KhmerDivider from "@/components/layout/KhmerDivider";

export default function MenuHeading() {
  const { t } = useLanguage();

  return (
    <div className="mb-10 text-center">
      <h1 className="font-heading text-4xl text-coffee-900 dark:text-cream-50">
        {t("menu.title")}
      </h1>
      <p className="mt-2 text-coffee-500 dark:text-cream-300">
        {t("menu.subtitle")}
      </p>
      <KhmerDivider className="mt-5" />
    </div>
  );
}
