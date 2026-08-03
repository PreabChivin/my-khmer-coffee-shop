"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import BongBear, { type BongBearPose } from "@/components/mascots/BongBear";
import ProductCard from "@/components/menu/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { pickSpotlightProducts } from "@/lib/productSpotlight";
import type { ProductDTO } from "@/lib/types";

const DISMISS_KEY = "cutePet.dismissed";

// Exactly the lines requested — Bong Bear already "greets guests" in the
// hero, so reusing him here (rather than an unrelated new cat/dog/panda)
// keeps one consistent mascot identity across the storefront.
const BUBBLE_LINES: { text: string; pose: BongBearPose }[] = [
  { text: "ឃ្លានកាហ្វេឈ្ងុយៗណាស់! ☕️", pose: "wave" },
  { text: "សុំ Matcha Latte មួយកែវមក! 🍵", pose: "wave" },
  { text: "ទិញនំញ៉ាំជាមួយគ្នាអត់? 🥐", pose: "wave" },
  { text: "អត់ទិញប្រយ័ត្នខ្ញុំយំ! 🥺", pose: "sad" },
  { text: "ចុចលើខ្ញុំមកចាំខ្ញុំប្រាប់ភេសជ្ជៈឆ្ងាញ់! ✨", pose: "cheer" },
];

const BUBBLE_VISIBLE_MS = 4500;
const CYCLE_MIN_MS = 5000;
const CYCLE_MAX_MS = 10000;

/** 🐻 Cute Cafe Pet Engine — a floating Bong Bear companion (reusing the
 *  cafe's existing mascot rather than a disconnected new character) that
 *  idles at the bottom-left, cycles playful Khmer speech bubbles, and on tap
 *  surprises the guest with a real recommended product. The recommendation
 *  is presented via the ACTUAL ProductCard component (not a reimplementation
 *  of add-to-cart), so customization/group-cart/pricing behave identically
 *  to picking the item from the menu grid — zero duplicated business logic.
 *  Scoped to the home page (where `products` is already loaded) rather than
 *  the whole storefront, since nagging a guest to buy more mid-checkout
 *  would be the wrong moment for this. Dismiss persists via localStorage. */
export default function CutePetMascot({ products }: { products: ProductDTO[] }) {
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState(true); // default hidden until we know localStorage says otherwise — avoids a flash on returning guests who dismissed it
  const [hydrated, setHydrated] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; pose: BongBearPose } | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const lastLineRef = useRef(-1);

  const pick = useMemo(() => pickSpotlightProducts(products, 1)[0] ?? null, [products]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let stored = false;
      try {
        stored = window.localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        // localStorage unavailable (e.g. private mode) — default to shown
      }
      setDismissed(stored);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // 💬 Speech bubble cycle — random 5–10s gap, never the same line twice in
  // a row, visible for a few seconds then hides before the next one.
  useEffect(() => {
    if (dismissed || !hydrated || showModal) return;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const gap = CYCLE_MIN_MS + Math.random() * (CYCLE_MAX_MS - CYCLE_MIN_MS);
      showTimer = setTimeout(() => {
        let next = Math.floor(Math.random() * BUBBLE_LINES.length);
        if (BUBBLE_LINES.length > 1 && next === lastLineRef.current) {
          next = (next + 1) % BUBBLE_LINES.length;
        }
        lastLineRef.current = next;
        setBubble(BUBBLE_LINES[next]);
        hideTimer = setTimeout(() => {
          setBubble(null);
          scheduleNext();
        }, BUBBLE_VISIBLE_MS);
      }, gap);
    }

    scheduleNext();
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [dismissed, hydrated, showModal]);

  function handlePetClick() {
    setBubble(null);
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 400);
    if (pick) setShowModal(true);
  }

  function dismiss(e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // best-effort only
    }
  }

  if (!hydrated || dismissed || !pick) return null;

  const currentPose: BongBearPose = isBouncing ? "cheer" : bubble?.pose ?? "wave";

  return (
    <>
      <div className="fixed bottom-5 left-4 z-40 flex flex-col items-start sm:bottom-6 sm:left-6">
        {/* 💬 Speech bubble */}
        {bubble && (
          <div className="animate-pop-in relative mb-2 ml-2 max-w-[13rem] rounded-2xl rounded-bl-sm border-2 border-clay-300 bg-white px-3 py-2 text-xs font-bold text-coffee-800 shadow-lg dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-100">
            {bubble.text}
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={dismiss}
            aria-label={lang === "km" ? "លាក់មិត្តភ័ក្តិ" : "Hide pet"}
            className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-coffee-900/70 text-white shadow-sm transition-transform hover:scale-110 active:scale-90"
          >
            <X size={11} />
          </button>
          <button
            type="button"
            onClick={handlePetClick}
            aria-label={lang === "km" ? "ចុចដើម្បីមើលអនុសាសន៍" : "Tap for a recommendation"}
            className={`animate-float-cute block drop-shadow-lg transition-transform duration-300 ${
              isBouncing ? "scale-125" : "hover:scale-110"
            }`}
          >
            <BongBear pose={currentPose} size={84} />
          </button>
        </div>
      </div>

      {showModal && pick && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/60 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="animate-pop-in w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="flex items-center gap-1.5 font-heading text-sm font-extrabold text-white drop-shadow-sm">
                🐻 {lang === "km" ? "ការណែនាំពី Bong Bear!" : "Bong Bear's pick!"}
              </p>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-transform hover:scale-110 active:scale-90"
              >
                <X size={14} />
              </button>
            </div>
            {/* Reuses the real menu ProductCard — customization, group-cart,
                and pricing all behave exactly as they do in the main grid. */}
            <ProductCard product={pick} />
          </div>
        </div>
      )}
    </>
  );
}
