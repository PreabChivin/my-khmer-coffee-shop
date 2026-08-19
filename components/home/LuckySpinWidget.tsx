"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Confetti from "@/components/Confetti";
import { SPIN_SEGMENTS } from "@/lib/spin";
import type { SpinResultDTO, SpinStatusDTO } from "@/lib/types";

const SEGMENT_DEG = 360 / SPIN_SEGMENTS.length;
const SEGMENT_COLORS = [
  "var(--color-clay-400)",
  "var(--color-crimson-400)",
  "var(--color-lavender-400)",
  "var(--color-gold-400)",
  "var(--color-matcha-400)",
  "var(--color-clay-600)",
];

function wheelBackground(): string {
  const stops = SPIN_SEGMENTS.map((_, i) => {
    const from = i * SEGMENT_DEG;
    const to = from + SEGMENT_DEG;
    return `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${from}deg ${to}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

/** 🎡 Floating Daily Lucky Spin widget — one free real spin per calendar
 *  day, credited via POST /api/spin. The wheel always visually lands on
 *  the server-chosen prize (SPIN_SEGMENTS), never an independent random
 *  animation, so what the user sees always matches what they were paid. */
export default function LuckySpinWidget() {
  const { user, refresh } = useSession();
  const { openAuth } = useAuthModal();
  const { lang } = useLanguage();
  const km = lang === "km";

  const [open, setOpen] = useState(false);
  const [alreadySpun, setAlreadySpun] = useState<boolean | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!open || !user || alreadySpun !== null) return;
    fetch("/api/spin")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SpinStatusDTO | null) => setAlreadySpun(Boolean(data?.alreadySpunToday)))
      .catch(() => {});
  }, [open, user, alreadySpun]);

  function toggle() {
    if (!user) {
      openAuth();
      return;
    }
    setOpen((v) => !v);
  }

  async function spin() {
    if (spinning || alreadySpun) return;
    setSpinning(true);
    setError(null);
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មានបញ្ហា" : "Something went wrong"));
        setAlreadySpun(true);
        setSpinning(false);
        return;
      }
      const prize: SpinResultDTO = data;
      const targetIndex = SPIN_SEGMENTS.indexOf(prize.pointsWon as (typeof SPIN_SEGMENTS)[number]);
      const idx = targetIndex === -1 ? 0 : targetIndex;
      const landingDeg = 360 - (idx * SEGMENT_DEG + SEGMENT_DEG / 2);
      setRotation((r) => r - (r % 360) + 360 * 5 + landingDeg);
      setTimeout(() => {
        setResult(prize.pointsWon);
        setAlreadySpun(true);
        setCelebrate(true);
        setSpinning(false);
        refresh();
        setTimeout(() => setCelebrate(false), 1000);
      }, 3200);
    } catch {
      setError(km ? "កំហុសបណ្ដាញ" : "Network error");
      setSpinning(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Lucky Daily Spin"
        className="animate-stage-glow glow-ring fixed bottom-24 right-5 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-clay-500 text-2xl shadow-lg transition-transform hover:scale-110 active:scale-90 sm:bottom-28 sm:right-6"
      >
        🎡
      </button>

      {open && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
          <div className="khmer-card relative w-full max-w-xs rounded-3xl bg-cream-50 p-6 text-center dark:bg-coffee-800">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-coffee-500 hover:text-coffee-800 dark:text-cream-300"
            >
              <X size={16} />
            </button>

            <h3 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
              🎡 {km ? "កង់បង្វិលសំណាងប្រចាំថ្ងៃ" : "Lucky Daily Spin"}
            </h3>
            <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">
              {km ? "បង្វិលម្តងក្នុងមួយថ្ងៃ ដើម្បីទទួលពិន្ទុឥតគិតថ្លៃ!" : "One free spin a day for bonus points!"}
            </p>

            <div className="relative mx-auto mt-5 h-48 w-48">
              <span className="absolute left-1/2 -top-1 z-10 -translate-x-1/2 text-2xl">🔻</span>
              <div
                className="h-full w-full rounded-full border-4 border-white shadow-inner dark:border-coffee-900"
                style={{
                  background: wheelBackground(),
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? "transform 3.1s cubic-bezier(0.15, 0.65, 0.15, 1)" : "none",
                }}
              >
                {SPIN_SEGMENTS.map((val, i) => {
                  const mid = i * SEGMENT_DEG + SEGMENT_DEG / 2;
                  return (
                    <span
                      key={val}
                      className="absolute left-1/2 top-1/2 text-xs font-extrabold text-white drop-shadow"
                      style={{ transform: `rotate(${mid}deg) translate(0, -68px) rotate(${-mid}deg)` }}
                    >
                      {val}💎
                    </span>
                  );
                })}
              </div>
            </div>

            {error && <p className="mt-3 text-xs font-semibold text-crimson-600">{error}</p>}

            {result !== null ? (
              <p className="mt-4 rounded-2xl bg-matcha-100 px-4 py-2.5 text-sm font-extrabold text-matcha-700">
                🎉 +{result} 💎 {km ? "ទទួលបានជោគជ័យ!" : "won!"}
              </p>
            ) : (
              <button
                type="button"
                onClick={spin}
                disabled={spinning || alreadySpun === true || alreadySpun === null}
                className="btn-tactile mt-4 w-full rounded-full bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:from-coffee-200 disabled:to-coffee-200 disabled:text-coffee-400"
              >
                {spinning
                  ? km
                    ? "កំពុងបង្វិល..."
                    : "Spinning..."
                  : alreadySpun
                    ? km
                      ? "សូមមកវិញថ្ងៃស្អែក ✨"
                      : "Come back tomorrow ✨"
                    : km
                      ? "បង្វិលឥឡូវ 🎡"
                      : "Spin Now 🎡"}
              </button>
            )}
          </div>
        </div>
      )}

      {celebrate && <Confetti />}
    </>
  );
}
