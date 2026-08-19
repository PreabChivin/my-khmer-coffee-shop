"use client";

import CreatureCardArt from "@/components/cards/CreatureCardArt";
import { ELEMENTS } from "@/lib/creatures";
import { STAR_LABEL, type Stars } from "@/lib/cardEngine";
import type { CreatureCardDTO } from "@/lib/types";

/** Rim/backing treatment per star rating — the higher the rarity the more
 *  the card "holos". 5★ gets the animated sweep (see .holo-sweep). */
const STAR_FRAME: Record<number, string> = {
  1: "from-coffee-300 to-coffee-400",
  2: "from-matcha-400 to-matcha-600",
  3: "from-clay-400 to-clay-600",
  4: "from-lavender-400 to-crimson-500",
  5: "from-gold-400 via-crimson-400 to-lavender-500",
};

export default function CreatureCardTile({
  card,
  km,
  onClick,
  selected,
  compact,
}: {
  card: CreatureCardDTO;
  km: boolean;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}) {
  const element = ELEMENTS[card.element] ?? ELEMENTS.SHADOW;
  const frame = STAR_FRAME[card.stars] ?? STAR_FRAME[1];
  const legendary = card.stars >= 5;
  const expPct =
    card.expNeeded > 0 ? Math.min(100, Math.round((card.exp / card.expNeeded) * 100)) : 100;

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group block w-full rounded-2xl bg-gradient-to-br p-[2px] text-left shadow-md transition-all duration-200 ${frame} ${
        onClick ? "hover:-translate-y-1 hover:shadow-xl active:scale-95" : ""
      } ${selected ? "ring-4 ring-gold-400 ring-offset-2 ring-offset-cream-50 dark:ring-offset-coffee-900" : ""}`}
    >
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-[calc(1rem-1px)] bg-cream-50/95 dark:bg-coffee-900/95 ${
          compact ? "p-2" : "p-2.5"
        }`}
      >
        {legendary && <span className="holo-sweep pointer-events-none absolute inset-0 z-10" />}

        {/* stars + element */}
        <div className="relative z-20 flex items-center justify-between">
          <span className="text-[10px] font-extrabold leading-none tracking-tight text-gold-500">
            {"★".repeat(card.stars)}
            <span className="text-coffee-300 dark:text-coffee-600">{"★".repeat(5 - card.stars)}</span>
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white"
            style={{ background: `linear-gradient(135deg, ${element.colors[0]}, ${element.colors[1]})` }}
          >
            {element.emoji} {km ? element.nameKm : element.nameEn}
          </span>
        </div>

        {/* art */}
        <div className="relative z-20 mx-auto my-1 w-full">
          <CreatureCardArt
            shape={card.shape}
            element={card.element}
            isShiny={card.isShiny}
            className={compact ? "h-20 w-full" : "h-28 w-full"}
          />
        </div>

        {/* name */}
        <p className="relative z-20 truncate text-center font-heading text-xs font-extrabold text-coffee-900 dark:text-cream-50">
          {km ? card.nameKm : card.nameEn}
          {card.isShiny && <span className="ml-0.5 text-gold-500">✦</span>}
        </p>
        <p className="relative z-20 text-center text-[9px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
          {km ? STAR_LABEL[card.stars as Stars]?.km : STAR_LABEL[card.stars as Stars]?.en}
        </p>

        {/* stats */}
        <div className="relative z-20 mt-1.5 flex items-center justify-between text-[10px] font-extrabold">
          <span className="rounded-full bg-coffee-100 px-1.5 py-0.5 text-coffee-700 dark:bg-coffee-800 dark:text-cream-200">
            Lv.{card.level}
          </span>
          <span className="text-crimson-600 dark:text-crimson-400">⚔ {card.power}</span>
        </div>

        {/* exp bar */}
        <div className="relative z-20 mt-1 h-1 w-full overflow-hidden rounded-full bg-coffee-200/70 dark:bg-coffee-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-matcha-400 to-matcha-600"
            style={{ width: `${expPct}%` }}
          />
        </div>
      </div>
    </Wrapper>
  );
}
