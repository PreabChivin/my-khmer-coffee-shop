"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Save, Swords } from "lucide-react";
import CreatureCardTile from "@/components/cards/CreatureCardTile";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";
import { DECK_SIZE } from "@/lib/battleEngine";
import { ELEMENTS } from "@/lib/creatures";
import type { CollectionResponseDTO, CreatureCardDTO } from "@/lib/types";

/**
 * ⚔️ Battle Deck Manager -- pick exactly 8 creatures from the collection to
 * enter the Battle Arena with. Saved server-side (POST /api/battle/deck) so
 * it is remembered for every future match, not reselected each time.
 */
export default function BattleDeckManager() {
  const { user } = useSession();
  const { openAuth } = useAuthModal();
  const { lang } = useLanguage();
  const km = lang === "km";

  const [collection, setCollection] = useState<CreatureCardDTO[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guests never fetch; the signed-out branch below returns before
    // `loading` is ever read, so nothing needs clearing here.
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/cards/collection").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/battle/deck").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([coll, deck]: [CollectionResponseDTO | null, { cardIds: string[] } | null]) => {
        if (cancelled) return;
        setCollection(coll?.cards ?? []);
        setSelected(deck?.cardIds ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const elementCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const id of selected) {
      const card = collection?.find((c) => c.id === id);
      if (card) counts[card.element] = (counts[card.element] ?? 0) + 1;
    }
    return counts;
  }, [selected, collection]);

  function toggle(cardId: string) {
    setSaved(false);
    setError(null);
    setSelected((prev) => {
      if (prev.includes(cardId)) {
        playSound("click");
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= DECK_SIZE) return prev;
      playSound("click");
      return [...prev, cardId];
    });
  }

  async function save() {
    if (selected.length !== DECK_SIZE) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/battle/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (km ? "មិនអាចរក្សាទុកបានទេ។" : "Couldn't save."));
        return;
      }
      playSound("upgrade");
      setSelected(data.cardIds);
      setSaved(true);
    } catch {
      setError(km ? "បណ្តាញមានបញ្ហា។" : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-5xl">⚔️</p>
        <h1 className="mt-3 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
          {km ? "កញ្ចប់ប្រយុទ្ធ" : "Battle Deck"}
        </h1>
        <p className="mt-2 text-sm text-coffee-500 dark:text-cream-300">
          {km ? "ចូលគណនីដើម្បីរៀបចំកញ្ចប់ប្រយុទ្ធ ៨ សន្លឹក។" : "Sign in to build your 8-card battle deck."}
        </p>
        <button
          type="button"
          onClick={() => {
            playSound("click");
            openAuth();
          }}
          className="btn-tactile mt-5 rounded-full bg-gradient-to-r from-accent to-accent-hover px-6 py-2.5 text-sm font-bold text-white shadow-md"
        >
          {km ? "ចូលគណនី" : "Sign In"}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={30} className="animate-spin text-coffee-400" />
      </div>
    );
  }

  const owned = collection?.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
        ⚔️ {km ? "កញ្ចប់ប្រយុទ្ធ" : "Battle Deck"}
      </h1>
      <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
        {km
          ? `ជ្រើសរើសសត្វ ៨ ក្បាលពីបណ្តុំរបស់អ្នក ដើម្បីចូលទីលានប្រយុទ្ធ`
          : `Pick exactly 8 creatures from your collection to enter the Battle Arena`}
      </p>

      {owned === 0 ? (
        <div className="khmer-card mt-6 rounded-3xl bg-cream-50/70 py-16 text-center dark:bg-coffee-800/50">
          <p className="text-5xl">📦</p>
          <p className="mt-3 font-heading text-base font-bold text-coffee-900 dark:text-cream-50">
            {km ? "អ្នកមិនទាន់មានសត្វទេ" : "No creatures yet"}
          </p>
          <Link
            href="/collection"
            className="btn-tactile mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-bold text-white shadow-md"
          >
            {km ? "ទៅកាន់បណ្តុំសត្វ" : "Go to My Collection"}
          </Link>
        </div>
      ) : (
        <>
          {/* Element balance strip */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {Object.entries(elementCounts).map(([el, count]) => {
              const meta = ELEMENTS[el as keyof typeof ELEMENTS];
              return (
                <span
                  key={el}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${meta.colors[0]}, ${meta.colors[1]})` }}
                >
                  {meta.emoji} {count}
                </span>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {collection!.map((card) => (
              <CreatureCardTile
                key={card.id}
                card={card}
                km={km}
                selected={selected.includes(card.id)}
                onClick={() => toggle(card.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Sticky save bar */}
      {owned > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/30 bg-cream-50/95 px-4 py-3 backdrop-blur-md dark:bg-coffee-900/95 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-coffee-800 dark:text-cream-100">
              {selected.length}/{DECK_SIZE} {km ? "សន្លឹកបានជ្រើសរើស" : "cards selected"}
              {error && <span className="ml-2 text-xs font-semibold text-crimson-600">{error}</span>}
            </p>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-xs font-bold text-matcha-600 dark:text-matcha-400">
                  <CheckCircle2 size={14} /> {km ? "បានរក្សាទុក!" : "Saved!"}
                </span>
              )}
              <button
                type="button"
                onClick={save}
                disabled={selected.length !== DECK_SIZE || saving}
                className="btn-tactile flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {km ? "រក្សាទុកកញ្ចប់" : "Save Deck"}
              </button>
              {saved && (
                <Link
                  href="/"
                  className="btn-tactile flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-400 to-crimson-400 px-5 py-2.5 text-sm font-extrabold text-coffee-900 shadow-md"
                >
                  <Swords size={15} /> {km ? "ចូលប្រយុទ្ធ" : "Enter Arena"}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
