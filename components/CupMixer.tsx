"use client";

import type { DrinkCustomization } from "@/lib/types";

/**
 * 🥤 Visual Cup Mixer — a pure-CSS animated cup that reacts live to the
 * customization state:
 *  - sweetness deepens the caramel/brown fluid gradient,
 *  - ice level nudges how full the cup is,
 *  - boba drops little pearls into the bottom.
 */
export default function CupMixer({
  customization,
  category,
}: {
  customization: DrinkCustomization;
  category: string;
}) {
  const { sweetness, ice, shots, boba } = customization;

  // Fluid height 55–90% of the cup; more ice = a touch less fluid room.
  const iceFactor = ice === "extra" ? -8 : ice === "less" ? 6 : ice === "none" ? 10 : 0;
  const fluidHeight = Math.min(90, 60 + sweetness * 0.18 + iceFactor);

  // Sweetness + shots deepen the caramel color.
  const isTea = category === "Tea";
  const lightness = Math.max(28, 74 - sweetness * 0.34 - shots * 4);
  const hue = isTea ? 96 : 28; // matcha-ish green for tea, caramel for coffee
  const sat = isTea ? 38 : 60;
  const top = `hsl(${hue}, ${sat}%, ${Math.min(90, lightness + 16)}%)`;
  const bottom = `hsl(${hue}, ${sat}%, ${lightness}%)`;

  const pearls = boba ? [0, 1, 2, 3, 4, 5, 6] : [];

  return (
    <div className="relative mx-auto h-40 w-32 select-none">
      {/* straw */}
      <div className="absolute -top-3 left-1/2 z-20 h-24 w-2.5 -translate-x-1/3 rotate-6 rounded-full bg-gradient-to-b from-clay-300 to-clay-500" />

      {/* lid */}
      <div className="absolute -top-1 left-1/2 z-10 h-4 w-[112%] -translate-x-1/2 rounded-full bg-cream-200 shadow-sm dark:bg-coffee-700" />

      {/* cup body (trapezoid) */}
      <div
        className="absolute inset-x-0 bottom-0 top-2 overflow-hidden border-x-2 border-b-2 border-white/70 bg-white/30 backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
        style={{
          clipPath: "polygon(12% 0, 88% 0, 78% 100%, 22% 100%)",
          borderBottomLeftRadius: "1.5rem",
          borderBottomRightRadius: "1.5rem",
        }}
      >
        {/* fluid */}
        <div
          className="absolute inset-x-0 bottom-0 transition-[height,background] duration-500 ease-out"
          style={{
            height: `${fluidHeight}%`,
            background: `linear-gradient(to bottom, ${top}, ${bottom})`,
          }}
        >
          {/* wavy surface */}
          <div
            className="absolute -top-2 left-0 h-4 w-full animate-pulse rounded-[100%]"
            style={{ background: top, opacity: 0.9 }}
          />
          {/* rising bubbles */}
          <span className="animate-steam absolute bottom-2 left-4 h-1.5 w-1.5 rounded-full bg-white/50" />
          <span
            className="animate-steam absolute bottom-3 right-5 h-2 w-2 rounded-full bg-white/40"
            style={{ animationDelay: "0.7s" }}
          />

          {/* 🧋 boba pearls settling at the bottom */}
          {pearls.map((i) => (
            <span
              key={i}
              className="animate-pop-in absolute bottom-1 h-3 w-3 rounded-full bg-gradient-to-br from-stone-700 to-black shadow"
              style={{
                left: `${12 + i * 11}%`,
                animationDelay: `${i * 90}ms`,
              }}
            />
          ))}
        </div>

        {/* ice cubes */}
        {ice !== "none" && (
          <>
            <span className="absolute right-3 top-3 h-4 w-4 rotate-12 rounded-md bg-white/50" />
            {(ice === "normal" || ice === "extra") && (
              <span className="absolute left-4 top-6 h-3.5 w-3.5 -rotate-6 rounded-md bg-white/40" />
            )}
            {ice === "extra" && (
              <span className="absolute left-8 top-2 h-3 w-3 rotate-3 rounded-md bg-white/40" />
            )}
          </>
        )}

        {/* glossy shine */}
        <div className="pointer-events-none absolute left-3 top-0 h-full w-3 bg-white/25" />
      </div>
    </div>
  );
}
