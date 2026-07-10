"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { playPop } from "@/lib/sfx";
import { randomFortune, type Fortune } from "@/lib/fortunes";
import { useLanguage } from "@/contexts/LanguageContext";

/** 🎲 Gen-Z Drink Finder & Fortune Bar — the hero's search + Vibe Shake
 *  focal point, replacing the old Delivery/PickUp fulfillment card. */
export default function DrinkFinderBar({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const { lang } = useLanguage();
  const { setVibe } = useCart();
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  function handleShake() {
    playPop();
    setIsShaking(true);
    window.setTimeout(() => setIsShaking(false), 500);
    const f = randomFortune();
    setFortune(f);
    setVibe(f);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      document
        .getElementById("menu-grid")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-coffee-400"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="🔍 ចង់រកភេសជ្ជៈផ្ដល់ក្ដីស្រឡាញ់មួយណាដែរម៉ាយដំឡូង...?"
            className="w-full rounded-full bg-white/95 py-3.5 pl-11 pr-4 text-sm font-medium text-coffee-900 shadow-xl outline-none ring-2 ring-white/40 transition-shadow placeholder:text-coffee-400 focus:ring-gold-500"
          />
        </div>
        <button
          type="button"
          onClick={handleShake}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-5 py-3.5 text-sm font-bold text-white shadow-xl transition-transform hover:scale-105 active:scale-95 ${
            isShaking ? "animate-wiggle" : ""
          }`}
        >
          🎲 គ្រវីកែវតាមជតារាសី (Vibe Shake)
        </button>
      </div>

      {fortune && (
        <div
          key={fortune.km}
          className="animate-pop-in mt-3 rounded-2xl bg-white/95 px-4 py-3 text-center shadow-xl"
        >
          <p className="text-2xl">{fortune.emoji}</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-coffee-800">
            {lang === "km" ? fortune.km : fortune.en}
          </p>
        </div>
      )}
    </div>
  );
}
