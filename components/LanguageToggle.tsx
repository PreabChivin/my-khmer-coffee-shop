"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-gold-500/60 bg-cream-50 p-0.5 text-xs font-bold dark:bg-coffee-800">
      {LANGUAGES.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLang(option.code)}
          aria-pressed={lang === option.code}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            lang === option.code
              ? "bg-coffee-800 text-gold-400"
              : "text-coffee-500 hover:text-coffee-800 dark:text-cream-300 dark:hover:text-cream-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
