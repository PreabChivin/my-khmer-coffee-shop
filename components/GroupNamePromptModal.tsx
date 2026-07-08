"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GroupNamePromptModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="khmer-card relative w-full max-w-xs rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-500 dark:bg-coffee-900">
            <Users size={22} />
          </span>
          <p className="mt-3 font-heading text-base text-coffee-900 dark:text-cream-50">
            {t("group.yourName")}
          </p>
        </div>
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("group.namePlaceholder")}
          className="mt-4 w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-center text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
        >
          {t("menu.addToCart")}
        </button>
      </form>
    </div>
  );
}
