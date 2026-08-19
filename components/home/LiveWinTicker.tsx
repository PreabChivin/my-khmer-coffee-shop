"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LiveTickerEntryDTO, LiveTickerResponseDTO } from "@/lib/types";

const POLL_MS = 20000;

const GAME_LABEL: Record<string, { km: string; en: string }> = {
  TICTACTOE: { km: "អុក-តុក-តេ", en: "Tic-Tac-Toe" },
  RPS: { km: "កូន-ក្រដាស-កន្ត្រៃ", en: "Rock-Paper-Scissors" },
};

/**
 * ⚡ Live activity ticker — always real GameSession wins from
 * /api/games/live-ticker, never a fabricated "someone's playing!" filler.
 * Renders nothing until there's real activity to show today.
 */
export default function LiveWinTicker() {
  const { lang } = useLanguage();
  const km = lang === "km";
  const [entries, setEntries] = useState<LiveTickerEntryDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/games/live-ticker")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: LiveTickerResponseDTO | null) => {
          if (!cancelled && data) setEntries(data.entries);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (entries.length === 0) return null;

  const loop = [...entries, ...entries];

  return (
    <div className="overflow-hidden border-y border-white/20 bg-black/15 py-2 backdrop-blur-sm">
      <div className="animate-ticker-scroll flex w-max items-center gap-8 whitespace-nowrap px-4 text-xs font-bold text-white hover:[animation-play-state:paused] sm:text-sm">
        {loop.map((e, i) => (
          <span key={`${e.id}-${i}`} className="flex items-center gap-1.5">
            <Zap size={13} className="text-gold-300" />
            {km
              ? `@${e.winnerName} បានឈ្នះក្នុង ${GAME_LABEL[e.gameType]?.km ?? e.gameType}!`
              : `@${e.winnerName} won in ${GAME_LABEL[e.gameType]?.en ?? e.gameType}!`}
          </span>
        ))}
      </div>
    </div>
  );
}
