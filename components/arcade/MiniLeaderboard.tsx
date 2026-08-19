"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LeaderboardRowDTO } from "@/lib/types";

const MEDAL = ["🥇", "🥈", "🥉"];

/** 🏆 Top 3 Arcade Champions, straight off the real public
 *  /api/leaderboard route (same data the full /leaderboard page ranks) —
 *  no separate endpoint, no fabricated standings. Renders nothing at all
 *  until there are real ranked players to show. */
export default function MiniLeaderboard() {
  const { lang } = useLanguage();
  const km = lang === "km";
  const [rows, setRows] = useState<LeaderboardRowDTO[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LeaderboardRowDTO[] | null) => {
        if (!cancelled && Array.isArray(data)) setRows(data.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="khmer-card rounded-3xl border border-gold-500/30 bg-cream-50/80 p-4 backdrop-blur-sm dark:bg-coffee-800/60">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-heading text-sm font-extrabold text-coffee-900 dark:text-cream-50">
          <Trophy size={15} className="text-gold-500" />
          {km ? "ជើងឯកអាកែត" : "Arcade Champions"}
        </p>
        <Link
          href="/leaderboard"
          className="text-[10px] font-bold text-clay-600 hover:underline dark:text-clay-400"
        >
          {km ? "មើលទាំងអស់ →" : "View all →"}
        </Link>
      </div>

      <ul className="space-y-1.5">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="flex items-center gap-2 rounded-2xl bg-white/70 px-2.5 py-2 dark:bg-coffee-900/70"
          >
            <span className="text-base leading-none">{MEDAL[i] ?? `#${row.rank}`}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-coffee-900 dark:text-cream-50">
              {row.name}
            </span>
            <span className="shrink-0 text-xs font-extrabold text-clay-600 dark:text-clay-400">
              {row.loyaltyPoints.toLocaleString()} 💎
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
