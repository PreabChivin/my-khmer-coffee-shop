"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WHEEL_PRIZES, prizeById } from "@/lib/wheel";
import { playSpin, playWin } from "@/lib/sfx";

// 8 segments = the 4 prizes twice, so the wheel feels full and fair.
const SEGMENTS = [...WHEEL_PRIZES, ...WHEEL_PRIZES];
const SEG_ANGLE = 360 / SEGMENTS.length;

/** conic-gradient background string of alternating prize colors. */
const CONIC = `conic-gradient(${SEGMENTS.map(
  (s, i) => `${s.color} ${i * SEG_ANGLE}deg ${(i + 1) * SEG_ANGLE}deg`
).join(", ")})`;

export default function WheelOfCoffee({
  wonPrize,
  onWin,
}: {
  wonPrize: string | null;
  onWin: (prizeId: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const settledRef = useRef(false);

  const won = prizeById(wonPrize);

  function spin() {
    if (spinning || wonPrize) return;
    setSpinning(true);
    settledRef.current = false;
    playSpin();

    const target = Math.floor(Math.random() * SEGMENTS.length);
    // Segment center angle (measured clockwise from top).
    const center = target * SEG_ANGLE + SEG_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * (SEG_ANGLE * 0.6);
    // Rotate 5 full turns then bring the chosen segment under the top pointer.
    const next = 360 * 5 + (360 - center) - jitter;

    // Accumulate so it always spins forward from wherever it is.
    setRotation((prev) => prev - (prev % 360) + next);

    window.setTimeout(() => {
      if (settledRef.current) return;
      settledRef.current = true;
      setSpinning(false);
      playWin();
      onWin(SEGMENTS[target].id);
    }, 4200);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-56 w-56">
        {/* pointer */}
        <div className="absolute -top-1 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[20px] border-x-transparent border-t-crimson-500 drop-shadow" />

        {/* wheel */}
        <div
          className="relative h-56 w-56 rounded-full border-4 border-white shadow-xl transition-transform duration-[4000ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ background: CONIC, transform: `rotate(${rotation}deg)` }}
        >
          {SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-left text-lg"
              style={{
                transform: `rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg) translateX(46px)`,
              }}
            >
              <span style={{ display: "inline-block", transform: "rotate(-90deg)" }}>
                {seg.emoji}
              </span>
            </div>
          ))}
          {/* hub */}
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-clay-400 bg-white text-center text-lg leading-8">
            🎡
          </div>
        </div>
      </div>

      {won ? (
        <div className="animate-pop-in mt-4 rounded-2xl bg-gradient-to-r from-clay-400 to-crimson-400 px-5 py-3 text-center text-white shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
            {t("wheel.youWon")}
          </p>
          <p className="text-lg font-extrabold">
            {won.emoji} {lang === "km" ? won.km : won.en}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="mt-4 rounded-full bg-gradient-to-r from-gold-400 to-clay-400 px-8 py-3 text-sm font-extrabold text-coffee-900 shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
        >
          {spinning ? t("wheel.spinning") : t("wheel.spinButton")}
        </button>
      )}
    </div>
  );
}
