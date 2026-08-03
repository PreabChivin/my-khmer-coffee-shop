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
}

const ROSTER: Critter[] = [
  {
    id: "bongbear",
    emoji: "bongbear",
    line: "ចង់បានភេសជ្ជៈពិសេសអត់ លោកខ្ញុំមានណែនាំ! ✨",
    craving: "host",
    bounce: "bounce-cute",
  },
  {
    id: "piggy",
    emoji: "🐷",
    line: "ញ៉ាំ croissant ជាមួយជ្រូកអត់? 🥐",
    craving: "pastry",
    bounce: "bounce-cute",
  },
  {
    id: "chick",
    emoji: "🐔",
    line: "មាន់ស្រែសុំអាយស៍ឡាតេមួយកែវ! ☕️",
    craving: "coffee",
    bounce: "leap",
  },
  {
    id: "ducky",
    emoji: "🦆",
    line: "ទាកាប៉ាឃ្លានតែបៃតងស្ទើរងាប់! 🍵",
    craving: "tea",
    bounce: "bounce-cute",
  },
  {
    id: "ellie",
    emoji: "🐘",
    line: "ដំរីតូចសុំកែវ XXL មួយ! 🥤",
    craving: "largest",
    bounce: "wiggle",
  },
  {
    id: "dino",
    emoji: "🦖",
    line: "ដាយណូស័រឃ្លានបាយ អត់បានញ៉ាំកាហ្វេ! 🦖⚡️",
    craving: "promo",
    bounce: "leap",
  },
];

const BOUNCE_CLASS: Record<BounceStyle, string> = {
  "bounce-cute": "animate-bounce-cute",
  leap: "animate-leap",
  wiggle: "animate-wiggle",
};

// 🚶 Calm-movement tuning — at most 3 critters exist on screen at once (one
// per "slot"); each slot runs its own independent walk -> idle+bubble ->
// walk cycle, rotating to the next roster member every time it finishes
// idling. Movement is a CSS `transition` on `transform` driven by React
// state changes (not an infinite @keyframes loop like the previous version)
// specifically so JS can know exactly when a critter has STOPPED and only
// then reveal its speech bubble — still fully compositor-driven/GPU, same
// performance characteristics as before, just with explicit phase control.
const MAX_ACTIVE = 3;
const WALK_MIN_S = 5;
const WALK_MAX_S = 8;
const IDLE_MIN_MS = 4000;
const IDLE_MAX_MS = 6000;
// Widened from 14-30 so the SAME calm 5-8s walk duration covers more visible
// ground — bigger sprites make identical movement much more perceptible, but
// a slightly longer stride also helps: at the old narrow step the motion was
// easy to miss entirely (read as "stuck") even before the size bump.
const STEP_MIN_VW = 20;
const STEP_MAX_VW = 42;
const LANE_MAX_VW = 68;
// More vertical spacing between slots now that sprites are much larger —
// the old 4/22/40px stagger would have overlapped at the new size.
const SLOT_BOTTOM_PX = [4, 46, 88];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** A gentle, bounded step from the current position — biased away from
 *  whichever edge it's nearest, so a critter never gets stuck oscillating
 *  against the same wall of the lane. */
function nextTarget(currentX: number): number {
  const step = randomBetween(STEP_MIN_VW, STEP_MAX_VW);
  const preferRight = currentX < LANE_MAX_VW / 2;
  const goRight = Math.random() < (preferRight ? 0.65 : 0.35);
  const target = goRight ? currentX + step : currentX - step;
  return Math.max(0, Math.min(LANE_MAX_VW, target));
}

interface SlotState {
  critterIdx: number;
  phase: "walking" | "idle";
  x: number;
  facingLeft: boolean;
  durationS: number;
  showBubble: boolean;
}

function initialSlots(): SlotState[] {
  return Array.from({ length: MAX_ACTIVE }, (_, i) => ({
    critterIdx: i,
    phase: "walking",
    x: 8 + i * 4,
    facingLeft: false,
    durationS: WALK_MIN_S,
    showBubble: false,
  }));
}

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

/** 🐷🐔🦆🐘🦖🐻 Pet Zoo — a calm, decluttered roaming-critter engine.
 *  Refactored from the original 6-simultaneous-critters version: now at
 *  most 3 are ever on screen (one per "slot"), each moving slowly (a 5-8s
 *  walk to a modest nearby spot, not a fast dash across the whole lane),
 *  then stopping to idle 4-6s — its speech bubble ONLY appears once it has
 *  actually stopped, so nobody has to chase a moving character to read it.
 *  Slots rotate through the full 6-member roster over time via a simple
 *  round-robin pointer, so every character still appears eventually without
 *  ever exceeding the 3-active cap. Contained to a slim safety lane fixed at
 *  the very bottom of the viewport — never over the header, product grid, or
 *  cart trigger — z-30, below ChatFab's z-60. Scoped to the home page only. */
export default function PetZoo({ products }: { products: ProductDTO[] }) {
  const { lang } = useLanguage();
  const [hydrated, setHydrated] = useState(false);
  const [zooOn, setZooOn] = useState(true);
  const [slots, setSlots] = useState<SlotState[]>(initialSlots);
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

  // 🚶 Per-slot walk -> idle+bubble -> walk loop. Each slot's `target`
  // (this walk's destination) is captured in closure and reused directly as
  // the next walk's start — no refs needed to read "current position" back.
  useEffect(() => {
    if (!hydrated || !zooOn) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let pointer = MAX_ACTIVE;

    function runSlot(slotIndex: number, critterIdx: number, startX: number) {
      if (cancelled) return;
      const target = nextTarget(startX);
      const durationS = randomBetween(WALK_MIN_S, WALK_MAX_S);
      const facingLeft = target < startX;

      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = {
          critterIdx,
          phase: "walking",
          x: target,
          facingLeft,
          durationS,
          showBubble: false,
        };
        return next;
      });

      const walkTimer = setTimeout(() => {
        if (cancelled) return;
        setSlots((prev) => {
          const next = [...prev];
          next[slotIndex] = { ...next[slotIndex], phase: "idle", showBubble: true };
          return next;
        });

        const idleMs = randomBetween(IDLE_MIN_MS, IDLE_MAX_MS);
        const idleTimer = setTimeout(() => {
          if (cancelled) return;
          const nextCritterIdx = pointer % ROSTER.length;
          pointer += 1;
          runSlot(slotIndex, nextCritterIdx, target);
        }, idleMs);
        timers.push(idleTimer);
      }, durationS * 1000);
      timers.push(walkTimer);
    }

    for (let i = 0; i < MAX_ACTIVE; i++) {
      runSlot(i, i, 8 + i * 4);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
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

  function handleCritterClick(critter: Critter, slotIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], showBubble: false };
      return next;
    });
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
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-48 sm:h-56"
        >
          {slots.map((slot, slotIndex) => {
            const critter = ROSTER[slot.critterIdx];
            // 📍 The lane container no longer clips overflow (a bubble needs
            // to render above AND sometimes past the lane's own left/right
            // edge), so instead we keep the bubble from sailing past the
            // actual VIEWPORT edge by switching its anchor: centered on the
            // critter normally, but pinned to the near edge once the critter
            // is close enough to one that a centered 15rem-wide bubble would
            // overhang it.
            const nearLeftEdge = slot.x < 18;
            const nearRightEdge = slot.x > LANE_MAX_VW - 18;
            const bubbleAnchorClass = nearLeftEdge
              ? "left-0"
              : nearRightEdge
                ? "right-0 left-auto"
                : "left-1/2 -translate-x-1/2";
            // The tail wedge points down at wherever the pet actually is,
            // which shifts with the same edge-aware anchor as the bubble
            // itself (see the clipping-fix task's note on why this can't
            // just always be centered).
            const tailPositionClass = nearLeftEdge
              ? "left-8"
              : nearRightEdge
                ? "right-8 left-auto"
                : "left-1/2 -translate-x-1/2";
            return (
              <div
                key={slotIndex}
                className="zoo-slot pointer-events-none absolute left-2"
                style={{
                  bottom: `${SLOT_BOTTOM_PX[slotIndex]}px`,
                  // ⚠️ Only translateX lives here now — deliberately NOT the
                  // facing-direction flip. This wrapper is also the bubble's
                  // positioning parent, and a scaleX(-1) up here would mirror
                  // the bubble's text AND silently invert its left-0/right-0
                  // edge anchoring (nested transforms compose, so undoing it
                  // on the bubble alone can restore the text but not the
                  // position). Simpler and correct: keep the flip scoped to
                  // just the character sprite below, which is the only part
                  // that actually needs to face a direction.
                  transform: `translateX(${slot.x}vw)`,
                  transition: `transform ${slot.durationS}s ease-in-out`,
                }}
              >
                {/* 💬 Only rendered once this slot has actually stopped —
                    scaled up to match the larger sprites, with a tail wedge
                    pointing at whichever pet is "talking". Anchored per
                    bubbleAnchorClass so it never overhangs the viewport edge. */}
                {slot.showBubble && (
                  <div
                    className={`animate-pop-in pointer-events-none absolute -top-28 w-max max-w-[18rem] rounded-2xl border-2 border-amber-200/80 bg-white/95 px-4 py-2.5 text-center text-base font-bold leading-snug text-slate-900 shadow-2xl ${bubbleAnchorClass}`}
                  >
                    {critter.line}
                    <span
                      aria-hidden
                      className={`absolute -bottom-1.5 h-4 w-4 rotate-45 border-b-2 border-r-2 border-amber-200/80 bg-white/95 ${tailPositionClass}`}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleCritterClick(critter, slotIndex)}
                  aria-label={critter.line}
                  className="pointer-events-auto relative block"
                >
                  {/* Soft contrast halo — helps a pet pop boldly against
                      whatever page content/color happens to be behind it,
                      without needing to draw custom art. */}
                  <span
                    aria-hidden
                    className="absolute inset-0 -z-10 scale-90 rounded-full bg-white/50 blur-lg dark:bg-coffee-950/40"
                  />
                  <span
                    className={`block ${
                      slot.phase === "walking" ? BOUNCE_CLASS[critter.bounce] : ""
                    }`}
                    style={slot.facingLeft ? { transform: "scaleX(-1)" } : undefined}
                  >
                    {critter.emoji === "bongbear" ? (
                      <BongBear pose="wave" size={88} className="drop-shadow-2xl" />
                    ) : (
                      <span className="block text-7xl drop-shadow-2xl sm:text-8xl">
                        {critter.emoji}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
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
