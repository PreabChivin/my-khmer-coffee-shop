"use client";

import { useState } from "react";
import Link from "next/link";
import { PackageOpen, Layers, Swords } from "lucide-react";
import BattleLobbyModal from "@/components/battle/BattleLobbyModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import CreatureCardArt from "@/components/cards/CreatureCardArt";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";
import { PACK_COST } from "@/lib/cardEngine";

/** A few showcase creatures for the banner — real roster entries, drawn
 *  with the same component the actual cards use. */
const SHOWCASE = [
  { shape: "wyrm", element: "FIRE" as const, rotate: "-rotate-12 -translate-x-6" },
  { shape: "avian", element: "STORM" as const, rotate: "rotate-0 z-10 scale-110" },
  { shape: "beast", element: "LIGHT" as const, rotate: "rotate-12 translate-x-6" },
];

/** 🃏 Dashboard headline for the Creature Card Collector. */
export default function CardGameBanner() {
  const { lang } = useLanguage();
  const { user } = useSession();
  const { openAuth } = useAuthModal();
  const [battleOpen, setBattleOpen] = useState(false);
  const km = lang === "km";

  function enterArena() {
    playSound("match");
    if (!user) {
      openAuth();
      return;
    }
    setBattleOpen(true);
  }

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coffee-900 via-lavender-900 to-crimson-700 p-6 text-white shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-lavender-500/25 blur-3xl" />

        <div className="relative grid items-center gap-6 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/20 px-3 py-1 text-[11px] font-extrabold text-gold-300 ring-1 ring-gold-400/40">
              ✦ {km ? "ហ្គេមថ្មី" : "NEW GAME"}
            </span>
            <h2 className="mt-2 font-heading text-3xl font-extrabold leading-tight drop-shadow-md sm:text-4xl">
              {km ? "អ្នកប្រមូលកាតសត្វ" : "Creature Card Collector"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-white/85 lg:mx-0">
              {km
                ? "បើកកញ្ចប់កាត ប្រមូលសត្វកម្រ ១★ ដល់ ៥★ និងដំឡើងកម្រិតរហូតដល់ Lv.100"
                : "Rip open booster packs, collect 1★ to 5★ creatures, and power them up to Lv.100."}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <Link
                href="/collection"
                onClick={() => playSound("click")}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-400 to-crimson-400 px-5 py-2.5 text-sm font-extrabold text-coffee-900 shadow-lg transition-transform hover:scale-105"
              >
                <PackageOpen size={16} /> {km ? "បើកកញ្ចប់" : "Open a Pack"} · {PACK_COST} 💎
              </Link>
              <Link
                href="/collection"
                onClick={() => playSound("click")}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-white/15 px-5 py-2.5 text-sm font-extrabold text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Layers size={16} /> {km ? "បណ្តុំរបស់ខ្ញុំ" : "My Collection"}
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <button
                type="button"
                onClick={enterArena}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-white/15 px-5 py-2.5 text-sm font-extrabold text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Swords size={16} /> {km ? "ទីលានប្រយុទ្ធ ១ទល់១" : "1v1 Battle Arena"}
              </button>
              <Link
                href="/battle-deck"
                onClick={() => playSound("click")}
                className="text-[11px] font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline"
              >
                {km ? "រៀបចំកញ្ចប់ប្រយុទ្ធ" : "Build your deck"}
              </Link>
            </div>
          </div>

          {/* Fanned showcase cards */}
          <div className="relative flex items-center justify-center">
            {SHOWCASE.map((s, i) => (
              <div
                key={i}
                className={`relative h-36 w-28 rounded-2xl bg-gradient-to-br from-gold-400 via-crimson-400 to-lavender-500 p-[2px] shadow-2xl transition-transform duration-300 hover:scale-110 sm:h-44 sm:w-32 ${s.rotate}`}
              >
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[calc(1rem-1px)] bg-coffee-900">
                  <span className="holo-sweep pointer-events-none absolute inset-0" />
                  <CreatureCardArt shape={s.shape} element={s.element} className="h-full w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {battleOpen && <BattleLobbyModal onClose={() => setBattleOpen(false)} />}
    </section>
  );
}
