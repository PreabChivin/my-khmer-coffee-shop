"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Confetti from "@/components/Confetti";
import type { MissionDTO } from "@/lib/types";

export default function MissionsPanel() {
  const { refresh } = useSession();
  const { lang, t } = useLanguage();
  const [missions, setMissions] = useState<MissionDTO[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  async function loadMissions() {
    try {
      const res = await fetch("/api/missions");
      if (res.ok) setMissions(await res.json());
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMissions)
      .catch(() => setMissions([]));
  }, []);

  async function claim(mission: MissionDTO) {
    setBusyKey(mission.key);
    setMsg(null);
    try {
      const res = await fetch("/api/missions/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionKey: mission.key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? t("missions.claimError") });
        return;
      }
      setMsg({ ok: true, text: `${mission.emoji} ${t("missions.claimSuccess")}` });
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1000);
      await refresh(); // updates the points balance
      await loadMissions();
    } catch {
      setMsg({ ok: false, text: t("missions.networkError") });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
        {t("missions.title")}
      </h2>

      {msg && (
        <p
          className={`mb-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            msg.ok
              ? "bg-matcha-100 text-matcha-700"
              : "bg-crimson-50 text-crimson-600 dark:bg-coffee-950"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="space-y-2">
        {missions.map((m) => {
          const busy = busyKey === m.key;
          return (
            <div
              key={m.key}
              className="khmer-card flex items-center gap-3 rounded-2xl bg-cream-50 p-3 dark:bg-coffee-800"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-200 to-crimson-200 text-2xl dark:from-coffee-900 dark:to-coffee-900">
                {m.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-bold text-coffee-900 dark:text-cream-50">
                  {lang === "km" ? m.titleKh : m.title}
                </p>
                <p className="text-xs font-bold text-clay-600 dark:text-clay-400">
                  +{m.rewardPoints} 💎
                </p>
              </div>
              <button
                type="button"
                disabled={!m.completed || m.claimed || busy}
                onClick={() => claim(m)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed ${
                  m.claimed
                    ? "bg-matcha-500 text-white"
                    : "bg-gradient-to-r from-clay-400 to-crimson-400 text-white disabled:from-coffee-200 disabled:to-coffee-200 disabled:text-coffee-400"
                }`}
              >
                {busy
                  ? "..."
                  : m.claimed
                    ? t("missions.claimed")
                    : m.completed
                      ? t("missions.claimBtn")
                      : t("missions.locked")}
              </button>
            </div>
          );
        })}
      </div>

      {celebrate && <Confetti />}
    </div>
  );
}
