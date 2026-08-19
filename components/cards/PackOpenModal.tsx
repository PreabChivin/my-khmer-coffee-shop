"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import Confetti from "@/components/Confetti";
import CreatureCardTile from "@/components/cards/CreatureCardTile";
import { playSound } from "@/lib/soundEngine";
import { PACK_COST } from "@/lib/cardEngine";
import type { CreatureCardDTO, PackOpenResultDTO } from "@/lib/types";

type Phase = "ready" | "tearing" | "revealing" | "done" | "error";

const TEAR_MS = 1100;
const REVEAL_STAGGER_MS = 260;

/**
 * 📦 Booster pack opening.
 *
 * The pull itself is decided entirely server-side by POST
 * /api/cards/packs/open — this component only sequences the reveal of what
 * came back. That ordering matters: the request fires when the tear starts,
 * so the animation is never blocking on the network, but the cards shown
 * are always the authoritative server result, never a client-side guess
 * that gets reconciled afterwards.
 */
export default function PackOpenModal({
  km,
  onClose,
  onOpened,
}: {
  km: boolean;
  onClose: () => void;
  /** Fired once with the freshly pulled cards + new balance, so the
   *  collection page can merge them in without a full refetch. */
  onOpened: (result: PackOpenResultDTO) => void;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [cards, setCards] = useState<CreatureCardDTO[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  async function openPack() {
    if (phase !== "ready") return;
    setPhase("tearing");
    setError(null);
    playSound("pack");

    const started = Date.now();
    try {
      const res = await fetch("/api/cards/packs/open", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចបើកបានទេ។" : "Couldn't open the pack."));
        setPhase("error");
        return;
      }
      const result = data as PackOpenResultDTO;

      // Always let the tear animation play out in full, even on a fast
      // response — a pack that pops instantly feels broken, not snappy.
      const wait = Math.max(0, TEAR_MS - (Date.now() - started));
      timersRef.current.push(
        setTimeout(() => {
          setCards(result.cards);
          setPhase("revealing");
          onOpened(result);

          result.cards.forEach((card, i) => {
            timersRef.current.push(
              setTimeout(() => {
                setRevealed(i + 1);
                playSound(card.stars >= 4 ? "legendary" : "reveal");
              }, i * REVEAL_STAGGER_MS)
            );
          });
          timersRef.current.push(
            setTimeout(
              () => setPhase("done"),
              result.cards.length * REVEAL_STAGGER_MS + 200
            )
          );
        }, wait)
      );
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
      setPhase("error");
    }
  }

  const bestStars = cards.reduce((m, c) => Math.max(m, c.stars), 0);
  const showConfetti = phase === "done" && bestStars >= 4;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-coffee-900/90 p-4 backdrop-blur-md">
      {showConfetti && <Confetti />}

      <div className="khmer-card relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-coffee-900 to-lavender-900 p-6 text-center text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          disabled={phase === "tearing"}
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform hover:scale-110 hover:bg-white/20 active:scale-95 disabled:opacity-40"
        >
          <X size={16} />
        </button>

        <p className="font-heading text-lg font-extrabold">
          🃏 {km ? "កញ្ចប់កាតសត្វ" : "Creature Booster Pack"}
        </p>

        {(phase === "ready" || phase === "tearing" || phase === "error") && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-8">
            <div
              className={`relative flex h-52 w-36 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-crimson-400 to-lavender-500 text-6xl shadow-2xl ${
                phase === "tearing" ? "animate-pack-shake" : ""
              }`}
            >
              <span className="drop-shadow-lg">🎴</span>
              <span className="holo-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" />
            </div>

            {phase === "error" ? (
              <>
                <p className="max-w-xs text-sm font-semibold text-crimson-300">{error}</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-tactile rounded-full bg-white/15 px-5 py-2 text-sm font-bold"
                >
                  {km ? "បិទ" : "Close"}
                </button>
              </>
            ) : phase === "tearing" ? (
              <p className="flex items-center gap-2 text-sm font-bold text-gold-300">
                <Loader2 size={16} className="animate-spin" />
                {km ? "កំពុងបើក..." : "Tearing it open..."}
              </p>
            ) : (
              <>
                <p className="text-xs text-white/70">
                  {km
                    ? `សត្វ ៥ ក្បាល · យ៉ាងតិច ១ ក្បាល ២★ ឬលើស`
                    : `5 creatures · at least one 2★ or better`}
                </p>
                <button
                  type="button"
                  onClick={openPack}
                  className="btn-tactile flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-crimson-400 px-7 py-3 text-sm font-extrabold text-coffee-900 shadow-lg transition-transform hover:scale-105"
                >
                  <Sparkles size={16} />
                  {km ? "បើកកញ្ចប់" : "Open Pack"} · {PACK_COST} 💎
                </button>
              </>
            )}
          </div>
        )}

        {(phase === "revealing" || phase === "done") && (
          <div className="mt-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {cards.map((card, i) => (
                <div key={card.id} className="relative">
                  {i < revealed ? (
                    <>
                      {card.stars >= 4 && (
                        <span className="animate-rarity-burst pointer-events-none absolute inset-0 rounded-2xl bg-gold-400/60 blur-xl" />
                      )}
                      <div
                        className="animate-card-reveal"
                        style={{ ["--reveal-delay" as string]: "0ms" }}
                      >
                        <CreatureCardTile card={card} km={km} compact />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/5 text-2xl">
                      🎴
                    </div>
                  )}
                </div>
              ))}
            </div>

            {phase === "done" && (
              <button
                type="button"
                onClick={onClose}
                className="btn-tactile mt-5 w-full rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 py-3 text-sm font-bold text-white shadow-lg"
              >
                {km ? "ល្អណាស់!" : "Awesome!"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
