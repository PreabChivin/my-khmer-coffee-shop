"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import LoyaltyProgress from "@/components/loyalty/LoyaltyProgress";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";
import type { GameStatsDTO } from "@/lib/types";

/** 👤 Dashboard left column: who you are, your Arcade Points + tier
 *  progress, and your real lifetime match record. Points/tier reuse the
 *  existing LoyaltyProgress card; the W/L/T line is the real
 *  /api/chat/games/stats scoreboard (User.gameWins/Losses/Ties), not a
 *  derived guess. Guests get a sign-in nudge instead. */
export default function PlayerProfileCard() {
  const { user } = useSession();
  const { openAuth } = useAuthModal();
  const { t, lang } = useLanguage();
  const km = lang === "km";
  const [stats, setStats] = useState<GameStatsDTO | null>(null);

  useEffect(() => {
    // No fetch for guests. Nothing to clear either: the guest branch below
    // returns before `stats` is ever read, so leaving it stale is harmless.
    if (!user) return;
    let cancelled = false;
    fetch("/api/chat/games/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: GameStatsDTO | null) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="khmer-card rounded-3xl border-2 border-dashed border-clay-300 bg-clay-50/70 p-5 text-center backdrop-blur-sm dark:border-coffee-600 dark:bg-coffee-900/50">
        <p className="text-3xl">💎</p>
        <p className="mt-1.5 font-heading text-sm font-bold text-coffee-900 dark:text-cream-50">
          {t("home.railGuestLoyaltyTitle")}
        </p>
        <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">
          {t("home.railGuestLoyaltyDesc")}
        </p>
        <button
          type="button"
          onClick={() => {
            playSound("click");
            openAuth();
          }}
          className="btn-tactile mt-3 rounded-full bg-gradient-to-r from-accent to-accent-hover px-5 py-2 text-xs font-bold text-white shadow-sm"
        >
          {t("home.railSignIn")}
        </button>
      </div>
    );
  }

  const record: { label: string; value: number; tone: string }[] = [
    { label: km ? "ឈ្នះ" : "Wins", value: stats?.wins ?? 0, tone: "text-matcha-600 dark:text-matcha-400" },
    { label: km ? "ចាញ់" : "Losses", value: stats?.losses ?? 0, tone: "text-crimson-600 dark:text-crimson-400" },
    { label: km ? "ស្មើ" : "Ties", value: stats?.ties ?? 0, tone: "text-gold-600 dark:text-gold-400" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="khmer-card rounded-3xl border border-gold-500/30 bg-cream-50/80 p-4 backdrop-blur-sm dark:bg-coffee-800/60">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold-500/60 bg-clay-100 text-lg dark:bg-coffee-900">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              "🎮"
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-extrabold text-coffee-900 dark:text-cream-50">
              {user.name}
            </p>
            <p className="text-[10px] font-semibold text-coffee-400 dark:text-cream-400">
              {km ? "អ្នកលេងអាកែត" : "Arcade Player"}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {record.map((r) => (
            <div
              key={r.label}
              className="rounded-2xl bg-white/70 px-1 py-2 text-center dark:bg-coffee-900/70"
            >
              <p className={`text-base font-extrabold leading-none ${r.tone}`}>{r.value}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                {r.label}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/avatar-studio"
          onClick={() => playSound("click")}
          className="btn-tactile mt-3 flex items-center justify-center gap-1.5 rounded-full bg-white/80 py-2 text-[11px] font-extrabold text-coffee-800 shadow-sm dark:bg-coffee-900/80 dark:text-cream-100"
        >
          <Sparkles size={12} /> {km ? "តុបតែងតួអង្គ" : "Customize Avatar"}
        </Link>
      </div>

      <LoyaltyProgress points={user.loyaltyPoints} />
    </div>
  );
}
