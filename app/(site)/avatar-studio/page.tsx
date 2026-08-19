"use client";

import { Sparkles } from "lucide-react";
import AvatarShop from "@/components/games/AvatarShop";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AvatarStudioPage() {
  const { lang } = useLanguage();
  const km = lang === "km";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
          <Sparkles size={22} className="text-clay-500" />
          {km ? "ស្ទូឌីយោអវតារ" : "Avatar Studio"}
        </h1>
        <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
          {km ? "តុបតែងតួអង្គរបស់អ្នកដោយប្រើពិន្ទុអាកែត" : "Customize your character using Arcade Points"}
        </p>
      </div>
      <AvatarShop />
    </div>
  );
}
