"use client";

import { useEffect, useMemo, useState } from "react";
import { PawPrint, X } from "lucide-react";
import BongBear from "@/components/mascots/BongBear";
import Confetti from "@/components/Confetti";
import ProductCard from "@/components/menu/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { computeAverageRating } from "@/lib/pricing";
import { hasAnyPromo } from "@/components/menu/PromoBadge";
import { pickSpotlightProducts } from "@/lib/productSpotlight";
import type { ProductDTO } from "@/lib/types";

const ZOO_OFF_KEY = "cafe.zooOff";

type Craving = "host" | "pastry" | "coffee" | "tea" | "largest" | "promo";
type BounceStyle = "bounce-cute" | "leap" | "wiggle";

interface Critter {
  id: string;
  emoji: string | "bongbear";
  line: string;
  craving: Craving;
  bounce: BounceStyle;
  /** Full round-trip walk duration — smaller = more energetic. */
  durationS: number;
  /** Negative so critters don't all start their cycle at the same position. */
  delayS: number;
  /** Vertical offset within the lane so paths don't overlap. */
  laneBottomPx: number;
  distanceVw: number;
}

const ROSTER: Critter[] = [
  {
    id: "bongbear",
    emoji: "bongbear",
    line: "ចង់បានភេសជ្ជៈពិសេសអត់ លោកខ្ញុំមានណែនាំ! ✨",
    craving: "host",
    bounce: "bounce-cute",
    durationS: 20,
    delayS: 0,
    laneBottomPx: 8,
    distanceVw: 55,
  },
  {
    id: "piggy",
    emoji: "🐷",
    line: "ញ៉ាំ croissant ជាមួយជ្រូកអត់? 🥐",
    craving: "pastry",
    bounce: "bounce-cute",
    durationS: 24,
    delayS: -6,
    laneBottomPx: 2,
    distanceVw: 65,
  },
  {
    id: "chick",
    emoji: "🐔",
    line: "មាន់ស្រែសុំអាយស៍ឡាតេមួយកែវ! ☕️",
    craving: "coffee",
    bounce: "leap",
    durationS: 10,
    delayS: -3,
    laneBottomPx: 20,
    distanceVw: 60,
  },
  {
    id: "ducky",
    emoji: "🦆",
    line: "ទាកាប៉ាឃ្លានតែបៃតងស្ទើរងាប់! 🍵",
    craving: "tea",
    bounce: "bounce-cute",
    durationS: 16,
    delayS: -9,
    laneBottomPx: 12,
    distanceVw: 70,
  },
  {
    id: "ellie",
    emoji: "🐘",
    line: "ដំរីតូចសុំកែវ XXL មួយ! 🥤",
    craving: "largest",
    bounce: "wiggle",
    durationS: 18,
    delayS: -12,
    laneBottomPx: 0,
    distanceVw: 50,
  },
  {
    id: "dino",
    emoji: "🦖",
    line: "ដាយណូស័រឃ្លានបាយ អត់បានញ៉ាំកាហ្វេ! 🦖⚡️",
    craving: "promo",
    bounce: "leap",
    durationS: 7,
    delayS: -2,
    laneBottomPx: 16,
    distanceVw: 68,
  },
];

const BOUNCE_CLASS: Record<BounceStyle, string> = {
  "bounce-cute": "animate-bounce-cute",
  leap: "animate-leap",
  wiggle: "animate-wiggle",
};

function pickBest(list: ProductDTO[]): ProductDTO | null {
  if (list.length === 0) return null;
  const rated = [...list]
    .filter((p) => p.ratingCount > 0)
    .sort(
      (a, b) =>
        computeAverageRating(b.ratingSum, b.ratingCount) -
        computeAverageRating(a.ratingSum, a.ratingCount)
    );
  return rated[0] ?? list[0];
}

/** Picks a REAL product matching each critter's craving — never fabricated.
 *  Falls back to the general top-spotlight pick if nothing matches, so a
 *  critter always has something honest to recommend. */
function pickForCraving(products: ProductDTO[], craving: Craving): ProductDTO | null {
  const available = products.filter((p) => p.isAvailable);
  const fallback = () => pickSpotlightProducts(products, 1)[0] ?? null;

  switch (craving) {
    case "coffee":
      return pickBest(available.filter((p) => p.category === "Coffee")) ?? fallback();
    case "tea":
      return pickBest(available.filter((p) => p.category === "Tea")) ?? fallback();
    case "pastry":
      return (
        pickBest(available.filter((p) => p.category !== "Coffee" && p.category !== "Tea")) ??
        fallback()
      );
    case "largest":
      return [...available].sort((a, b) => b.price - a.price)[0] ?? fallback();
    case "promo":
      return pickBest(available.filter((p) => hasAnyPromo(p))) ?? fallback();
    case "host":
    default:
      return fallback();
  }
}

/** 🐷🐔🦆🐘🦖🐻 Pet Zoo — the storefront's roaming-critter engine. Replaces
 *  the earlier single anchored CutePetMascot: Bong Bear now roams as part of
 *  one consolidated roster instead of a separate always-anchored widget.
 *  Contained to a slim "safety lane" fixed at the very bottom of the
 *  viewport (not true free-roam) so a critter can never wander over the
 *  header, product grid, or cart trigger — z-30, below ChatFab's z-60, so
 *  the chat button always stays on top and clickable even if a critter
 *  passes near it. Scoped to the home page only (product data is already
 *  loaded there; a checkout page is the wrong moment for roaming animals). */
export default function PetZoo({ products }: { products: ProductDTO[] }) {
  const { lang } = useLanguage();
  const [hydrated, setHydrated] = useState(false);
  const [zooOn, setZooOn] = useState(true);
  const [activeBubble, setActiveBubble] = useState<Record<string, boolean>>({});
  const [celebrate, setCelebrate] = useState(false);
  const [activeCritter, setActiveCritter] = useState<Critter | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let off = false;
      try {
        off = window.localStorage.getItem(ZOO_OFF_KEY) === "1";
      } catch {
        // localStorage unavailable — default to on
      }
      setZooOn(!off);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // 💬 Each critter cycles its own bubble independently on a random 4-8s
  // gap, so the roster never syncs into one big simultaneous pop.
  useEffect(() => {
    if (!hydrated || !zooOn) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    ROSTER.forEach((critter) => {
      function scheduleNext() {
        const gap = 4000 + Math.random() * 4000;
        const showTimer = setTimeout(() => {
          setActiveBubble((prev) => ({ ...prev, [critter.id]: true }));
          const hideTimer = setTimeout(() => {
            setActiveBubble((prev) => ({ ...prev, [critter.id]: false }));
            scheduleNext();
          }, 3200);
          timers.push(hideTimer);
        }, gap);
        timers.push(showTimer);
      }
      scheduleNext();
    });

    return () => timers.forEach(clearTimeout);
  }, [hydrated, zooOn]);

  const recommendation = useMemo(
    () => (activeCritter ? pickForCraving(products, activeCritter.craving) : null),
    [activeCritter, products]
  );

  function toggleZoo() {
    const next = !zooOn;
    setZooOn(next);
    try {
      window.localStorage.setItem(ZOO_OFF_KEY, next ? "0" : "1");
    } catch {
      // best-effort only
    }
  }

  function handleCritterClick(critter: Critter) {
    setActiveBubble((prev) => ({ ...prev, [critter.id]: false }));
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1000);
    setActiveCritter(critter);
  }

  if (!hydrated) return null;

  return (
    <>
      {/* 🐾 Subtle ON/OFF toggle — always in the same spot regardless of
          where the critters currently are in their walk cycle. */}
      <button
        type="button"
        onClick={toggleZoo}
        aria-label={
          zooOn
            ? lang === "km"
              ? "បិទសួនសត្វ"
              : "Turn zoo off"
            : lang === "km"
              ? "បើកសួនសត្វ"
              : "Turn zoo on"
        }
        title={zooOn ? "ZOO ON" : "ZOO OFF"}
        className={`btn-tactile fixed bottom-2 left-2 z-40 flex h-8 w-8 items-center justify-center rounded-full shadow-md ${
          zooOn
            ? "bg-matcha-400 text-white"
            : "bg-coffee-200 text-coffee-500 dark:bg-coffee-800 dark:text-cream-400"
        }`}
      >
        <PawPrint size={14} />
      </button>

      {zooOn && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-24 overflow-hidden sm:h-28"
        >
          {ROSTER.map((critter) => (
            <div
              key={critter.id}
              className="zoo-critter pointer-events-none absolute left-2"
              style={
                {
                  bottom: `${critter.laneBottomPx}px`,
                  animationDuration: `${critter.durationS}s`,
                  animationDelay: `${critter.delayS}s`,
                  "--zoo-distance": `${critter.distanceVw}vw`,
                  "--zoo-bob": "-4px",
                } as React.CSSProperties
              }
            >
              {activeBubble[critter.id] && (
                <div className="animate-pop-in pointer-events-none absolute -top-11 left-1/2 w-max max-w-[10rem] -translate-x-1/2 rounded-2xl rounded-bl-sm border-2 border-clay-300 bg-white px-2.5 py-1.5 text-center text-[11px] font-bold leading-snug text-coffee-800 shadow-lg dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-100">
                  {critter.line}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleCritterClick(critter)}
                aria-label={critter.line}
                className="pointer-events-auto block"
              >
                <span className={`block ${BOUNCE_CLASS[critter.bounce]}`}>
                  {critter.emoji === "bongbear" ? (
                    <BongBear pose="wave" size={56} />
                  ) : (
                    <span className="block text-4xl drop-shadow-md sm:text-5xl">
                      {critter.emoji}
                    </span>
                  )}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {celebrate && <Confetti />}

      {activeCritter && recommendation && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/60 p-4 backdrop-blur-sm"
          onClick={() => setActiveCritter(null)}
        >
          <div className="animate-pop-in w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="flex items-center gap-1.5 font-heading text-sm font-extrabold text-white drop-shadow-sm">
                {activeCritter.emoji === "bongbear" ? "🐻" : activeCritter.emoji}{" "}
                {lang === "km" ? "សំណូមពរពិសេស!" : "Special recommendation!"}
              </p>
              <button
                type="button"
                onClick={() => setActiveCritter(null)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-transform hover:scale-110 active:scale-90"
              >
                <X size={14} />
              </button>
            </div>
            {/* Reuses the real menu ProductCard — customization, group-cart,
                and pricing all behave exactly as they do in the main grid. */}
            <ProductCard product={recommendation} />
          </div>
        </div>
      )}
    </>
  );
}
