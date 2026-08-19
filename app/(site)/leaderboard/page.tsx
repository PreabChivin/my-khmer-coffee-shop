"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Trophy, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { tierProgress } from "@/lib/loyaltyPoints";
import type { LeaderboardRowDTO } from "@/lib/types";

const PublicPlayerModal = dynamic(() => import("@/components/games/PublicPlayerModal"));

type Tab = "ALL_TIME" | "WEEKLY" | "DAILY";

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const { lang } = useLanguage();
  const km = lang === "km";
  const [tab, setTab] = useState<Tab>("ALL_TIME");
  const [rows, setRows] = useState<LeaderboardRowDTO[] | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="flex items-center justify-center gap-2 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
          <Trophy size={24} className="text-gold-500" />
          {km ? "តារាងចំណាត់ថ្នាក់" : "Leaderboard"}
        </h1>
        <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
          {km ? "ចំណាត់ថ្នាក់តាមពិន្ទុអាកែត" : "Ranked by Arcade Points"}
        </p>
      </div>

      <div className="mb-5 flex justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setTab("ALL_TIME")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
            tab === "ALL_TIME"
              ? "bg-gradient-to-r from-clay-400 to-crimson-400 text-white"
              : "bg-cream-100 text-coffee-500 dark:bg-coffee-800 dark:text-cream-300"
          }`}
        >
          {km ? "គ្រប់កាល" : "All-Time"}
        </button>
        {(["WEEKLY", "DAILY"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            disabled
            title={km ? "ឆាប់ៗនេះ" : "Coming Soon"}
            className="flex cursor-not-allowed items-center gap-1 rounded-full bg-cream-100 px-4 py-1.5 text-xs font-bold text-coffee-300 dark:bg-coffee-800 dark:text-cream-600"
          >
            <Lock size={10} />
            {t === "WEEKLY" ? (km ? "ប្រចាំសប្តាហ៍" : "Weekly") : km ? "ប្រចាំថ្ងៃ" : "Daily"}
          </button>
        ))}
      </div>

      {rows === null ? (
        <p className="py-10 text-center text-sm text-coffee-400 dark:text-cream-400">
          {km ? "កំពុងផ្ទុក..." : "Loading..."}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-coffee-300 px-6 py-10 text-center text-sm text-coffee-400 dark:border-coffee-600 dark:text-cream-400">
          {km ? "មិនទាន់មានចំណាត់ថ្នាក់ទេ — លេងហ្គេមដើម្បីរកពិន្ទុ!" : "No rankings yet — play a game to earn points!"}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const tier = tierProgress(row.loyaltyPoints);
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setViewingId(row.id)}
                className="khmer-card btn-tactile flex w-full items-center gap-3 rounded-2xl bg-cream-50 p-3 text-left dark:bg-coffee-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-100 text-sm font-extrabold text-coffee-700 dark:bg-coffee-900 dark:text-cream-200">
                  {RANK_MEDAL[row.rank] ?? row.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-bold text-coffee-900 dark:text-cream-50">
                    {row.name}
                  </p>
                  <p className="text-[11px] text-coffee-400 dark:text-cream-400">
                    {tier.current.emoji} {km ? tier.current.km : tier.current.name}
                  </p>
                </span>
                <span className="shrink-0 font-bold text-clay-600 dark:text-clay-400">
                  {row.loyaltyPoints.toLocaleString()} 💎
                </span>
              </button>
            );
          })}
        </div>
      )}

      {viewingId && <PublicPlayerModal userId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}
