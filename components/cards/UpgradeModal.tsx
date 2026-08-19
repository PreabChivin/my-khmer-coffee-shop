"use client";

import { useMemo, useState } from "react";
import { X, ArrowUp, Loader2 } from "lucide-react";
import CreatureCardTile from "@/components/cards/CreatureCardTile";
import { playSound } from "@/lib/soundEngine";
import { DIAMOND_TO_EXP, MAX_LEVEL, feedExpValue } from "@/lib/cardEngine";
import type { CreatureCardDTO, UpgradeResultDTO } from "@/lib/types";

const DIAMOND_STEPS = [0, 30, 60, 120];

/**
 * ⬆️ POWER UP — spend Diamonds and/or sacrifice duplicate cards for EXP.
 *
 * Both the EXP totals and the level roll-up are recomputed authoritatively
 * server-side (app/api/cards/[id]/upgrade). The preview here uses the same
 * lib/cardEngine functions purely so the numbers on screen match what the
 * server will do — it is never the source of truth.
 */
export default function UpgradeModal({
  card,
  collection,
  diamonds,
  km,
  onClose,
  onUpgraded,
}: {
  card: CreatureCardDTO;
  /** Everything the player owns, so duplicates can be picked as fodder. */
  collection: CreatureCardDTO[];
  diamonds: number;
  km: boolean;
  onClose: () => void;
  onUpgraded: (result: UpgradeResultDTO, consumedIds: string[]) => void;
}) {
  const [spend, setSpend] = useState(0);
  const [feedIds, setFeedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMax = card.level >= MAX_LEVEL;

  // Anything except the card being upgraded is valid fodder.
  const fodder = useMemo(
    () => collection.filter((c) => c.id !== card.id),
    [collection, card.id]
  );

  const feedExp = useMemo(
    () =>
      fodder
        .filter((c) => feedIds.includes(c.id))
        .reduce((sum, c) => sum + feedExpValue(c), 0),
    [fodder, feedIds]
  );
  const totalExp = feedExp + spend * DIAMOND_TO_EXP;

  function toggleFeed(id: string) {
    playSound("click");
    setFeedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit() {
    if (busy || isMax || totalExp <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${card.id}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diamonds: spend, feedCardIds: feedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចដំឡើងបានទេ។" : "Upgrade failed."));
        return;
      }
      playSound("upgrade");
      onUpgraded(data as UpgradeResultDTO, feedIds);
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-coffee-900/85 p-4 backdrop-blur-md">
      <div className="khmer-card relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-cream-50 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-coffee-100 text-coffee-500 transition-transform hover:scale-110 dark:bg-coffee-900 dark:text-cream-300"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto p-5">
          <p className="text-center font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
            ⬆️ {km ? "ដំឡើងកម្រិត" : "Power Up"}
          </p>

          <div className="mx-auto mt-3 w-40">
            <CreatureCardTile card={card} km={km} />
          </div>

          {isMax ? (
            <p className="mt-4 rounded-2xl bg-gold-100 px-4 py-3 text-center text-sm font-bold text-gold-700">
              {km ? "កាតនេះឈានដល់កម្រិតអតិបរមា Lv.100 ហើយ! 🌟" : "This creature is already Lv.100! 🌟"}
            </p>
          ) : (
            <>
              {/* Diamond spend */}
              <p className="mt-5 text-xs font-bold text-coffee-600 dark:text-cream-200">
                💎 {km ? "ចំណាយពិន្ទុ" : "Spend Diamonds"}{" "}
                <span className="font-normal text-coffee-400">
                  ({km ? "មាន" : "you have"} {diamonds.toLocaleString()})
                </span>
              </p>
              <div className="mt-1.5 flex gap-2">
                {DIAMOND_STEPS.map((amount) => {
                  const affordable = amount <= diamonds;
                  return (
                    <button
                      key={amount}
                      type="button"
                      disabled={!affordable}
                      onClick={() => {
                        playSound("click");
                        setSpend(amount);
                      }}
                      className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        spend === amount
                          ? "border-gold-500 bg-coffee-800 text-gold-400"
                          : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                      }`}
                    >
                      {amount === 0 ? (km ? "គ្មាន" : "None") : amount}
                    </button>
                  );
                })}
              </div>

              {/* Fodder picker */}
              {fodder.length > 0 && (
                <>
                  <p className="mt-5 text-xs font-bold text-coffee-600 dark:text-cream-200">
                    🍖 {km ? "ប្រើកាតជាចំណី (កាតនឹងបាត់)" : "Sacrifice cards for EXP (they are consumed)"}
                  </p>
                  <div className="mt-1.5 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto rounded-2xl bg-coffee-50 p-2 dark:bg-coffee-900/60 sm:grid-cols-4">
                    {fodder.map((c) => (
                      <CreatureCardTile
                        key={c.id}
                        card={c}
                        km={km}
                        compact
                        selected={feedIds.includes(c.id)}
                        onClick={() => toggleFeed(c.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Preview */}
              <div className="mt-5 rounded-2xl bg-matcha-50 px-4 py-3 text-center dark:bg-coffee-900">
                <p className="text-xs font-bold text-coffee-500 dark:text-cream-300">
                  {km ? "EXP ដែលនឹងទទួលបាន" : "EXP to be gained"}
                </p>
                <p className="text-2xl font-extrabold text-matcha-600 dark:text-matcha-400">
                  +{totalExp.toLocaleString()}
                </p>
              </div>

              {error && (
                <p className="mt-3 rounded-xl bg-crimson-50 px-3 py-2 text-center text-xs font-semibold text-crimson-600 dark:bg-coffee-950">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={busy || totalExp <= 0}
                className="btn-tactile mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-hover py-3 text-sm font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
                {busy ? (km ? "កំពុងដំឡើង..." : "Powering up...") : km ? "ដំឡើងកម្រិត" : "POWER UP"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
