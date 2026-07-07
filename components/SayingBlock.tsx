"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { sayingMeaning, type CulturalSaying } from "@/lib/i18n";

interface SayingBlockProps {
  saying: CulturalSaying;
  /** "light" text sits on a dark/crimson background; "dark" on cream. */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}

export default function SayingBlock({
  saying,
  variant = "dark",
  size = "md",
}: SayingBlockProps) {
  const { lang, t } = useLanguage();
  const isLight = variant === "light";

  const proverbSize =
    size === "lg"
      ? "text-2xl sm:text-3xl"
      : size === "md"
        ? "text-xl sm:text-2xl"
        : "text-lg";

  return (
    <div className="flex flex-col items-center text-center">
      <span
        className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${
          isLight ? "text-gold-400" : "text-gold-600"
        }`}
      >
        {t("cultural.label")}
      </span>
      <p
        className={`khmer-heading-glow mt-3 font-heading leading-relaxed ${proverbSize} ${
          isLight ? "text-cream-50" : "text-coffee-900 dark:text-cream-50"
        }`}
      >
        “{saying.km}”
      </p>
      <p
        className={`mt-3 max-w-md text-sm italic ${
          isLight ? "text-cream-100/90" : "text-coffee-500 dark:text-cream-300"
        }`}
      >
        {sayingMeaning(saying, lang)}
      </p>
    </div>
  );
}
