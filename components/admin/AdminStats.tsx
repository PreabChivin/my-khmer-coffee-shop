"use client";

import { useEffect, useState } from "react";
import { Coins, ShoppingBag, Ticket, Trophy, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedName } from "@/lib/i18n";
import { prizeById } from "@/lib/wheel";
import type { AdminStatsResponseBody } from "@/app/api/admin/stats/route";

const POLL_INTERVAL_MS = 15000;
const MEDALS = ["🥇", "🥈", "🥉"];

export default function AdminStats() {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState<AdminStatsResponseBody | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok || cancelled) return;
        setStats(await res.json());
      } catch {
        // transient network hiccup — the next poll tick retries
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const maxSold = stats?.topSellers[0]?.totalSold ?? 1;
  const topProduct = stats?.topSellers[0] ?? null;

  return (
    <div>
      {/* 📊 Live Performance Metrics — 3 headline cards, exact requested
          labels. The richer panel below (Bestie Carts, full top-3 lists,
          spins) stays as its own section since it has more detail than
          these 3 cards are meant to show at a glance. */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass-card khmer-card flex items-center gap-3 rounded-2xl p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700 dark:bg-coffee-900 dark:text-gold-400">
            <Coins size={22} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("metrics.todayRevenue")}
            </p>
            <p className="text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
              ${(stats?.dailyEarnings ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="glass-card khmer-card flex items-center gap-3 rounded-2xl p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crimson-100 text-crimson-600 dark:bg-coffee-900 dark:text-crimson-400">
            <ShoppingBag size={22} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("metrics.activeOrders")}
            </p>
            <p className="text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
              {stats?.activeOrders ?? 0}
            </p>
          </div>
        </div>

        <div className="glass-card khmer-card flex items-center gap-3 rounded-2xl p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-matcha-100 text-matcha-700">
            <Trophy size={22} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("metrics.topProduct")}
            </p>
            <p className="truncate text-lg font-extrabold text-coffee-900 dark:text-cream-50">
              {topProduct ? localizedName(topProduct, lang) : t("metrics.none")}
            </p>
          </div>
        </div>
      </div>

      <div className="khmer-card mb-6 rounded-2xl bg-gradient-to-br from-clay-50 to-cream-100 p-5 dark:from-coffee-800 dark:to-coffee-900">
        <p className="mb-4 font-heading text-base text-coffee-900 dark:text-cream-50">
          {t("adminStats.title")}
        </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-coffee-800/70">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-100 text-gold-700 dark:bg-coffee-900 dark:text-gold-400">
            <Coins size={18} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("adminStats.dailyEarnings")}
            </p>
            <p className="text-lg font-bold text-coffee-900 dark:text-cream-50">
              ${(stats?.dailyEarnings ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-coffee-800/70">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-matcha-100 text-matcha-700">
            <Users size={18} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("adminStats.activeGroups")}
            </p>
            <p className="text-lg font-bold text-coffee-900 dark:text-cream-50">
              {stats?.activeGroupCarts ?? 0}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 p-3 dark:bg-coffee-800/70">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-coffee-400 dark:text-cream-400">
            <Trophy size={13} />
            {t("adminStats.topSellers")}
          </p>
          {!stats || stats.topSellers.length === 0 ? (
            <p className="text-xs text-coffee-400 dark:text-cream-400">
              {t("adminStats.noSales")}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {stats.topSellers.map((item, i) => (
                <li key={item.productId} className="flex items-center gap-2">
                  <span className="w-4 text-xs">{MEDALS[i]}</span>
                  <span className="flex-1 truncate text-xs font-medium text-coffee-800 dark:text-cream-100">
                    {localizedName(item, lang)}
                  </span>
                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-coffee-100 dark:bg-coffee-700">
                    <div
                      className="h-full rounded-full bg-gold-500"
                      style={{ width: `${(item.totalSold / maxSold) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] text-coffee-500 dark:text-cream-300">
                    {item.totalSold}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white/70 p-3 dark:bg-coffee-800/70">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-coffee-400 dark:text-cream-400">
            <Ticket size={13} />
            {t("adminStats.mostSpun")}
          </p>
          {!stats || stats.topSpins.length === 0 ? (
            <p className="text-xs text-coffee-400 dark:text-cream-400">
              {t("adminStats.noSpins")}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {stats.topSpins.map((row, i) => {
                const prize = prizeById(row.prizeId);
                return (
                  <li key={row.prizeId} className="flex items-center gap-2">
                    <span className="w-4 text-xs">{MEDALS[i]}</span>
                    <span className="flex-1 truncate text-xs font-medium text-coffee-800 dark:text-cream-100">
                      {prize ? `${prize.emoji} ${lang === "km" ? prize.km : prize.en}` : row.prizeId}
                    </span>
                    <span className="w-6 text-right text-[11px] text-coffee-500 dark:text-cream-300">
                      {row.count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
