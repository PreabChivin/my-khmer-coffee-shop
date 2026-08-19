"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, PackageOpen, Sparkles } from "lucide-react";
import CreatureCardTile from "@/components/cards/CreatureCardTile";
import PackOpenModal from "@/components/cards/PackOpenModal";
import UpgradeModal from "@/components/cards/UpgradeModal";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ELEMENTS, ELEMENT_KEYS, type Element } from "@/lib/creatures";
import { playSound } from "@/lib/soundEngine";
import type {
  CollectionResponseDTO,
  CreatureCardDTO,
  PackOpenResultDTO,
  UpgradeResultDTO,
} from "@/lib/types";

type SortKey = "power" | "stars" | "level" | "newest";

const SORTS: { key: SortKey; en: string; km: string }[] = [
  { key: "power", en: "Power", km: "កម្លាំង" },
  { key: "stars", en: "Rarity", km: "កម្រិតកម្រ" },
  { key: "level", en: "Level", km: "កម្រិត" },
  { key: "newest", en: "Newest", km: "ថ្មីបំផុត" },
];

/** 🃏 My Card Collection / បណ្តុំសត្វរបស់ខ្ញុំ — the collection manager:
 *  browse, filter by element/star, sort, open packs, and power up. */
export default function CollectionPage() {
  const { user, refresh } = useSession();
  const { openAuth } = useAuthModal();
  const { lang } = useLanguage();
  const km = lang === "km";

  const [data, setData] = useState<CollectionResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [packOpen, setPackOpen] = useState(false);
  const [upgrading, setUpgrading] = useState<CreatureCardDTO | null>(null);

  const [element, setElement] = useState<Element | "ALL">("ALL");
  const [minStars, setMinStars] = useState(0);
  const [sort, setSort] = useState<SortKey>("power");

  useEffect(() => {
    // Guests never fetch. `loading` is not cleared here on purpose: the
    // signed-out branch below returns before it is ever read.
    if (!user) return;
    let cancelled = false;
    fetch("/api/cards/collection")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CollectionResponseDTO | null) => {
        if (cancelled) return;
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const visible = useMemo(() => {
    const cards = (data?.cards ?? []).filter(
      (c) => (element === "ALL" || c.element === element) && c.stars >= minStars
    );
    const sorted = [...cards];
    switch (sort) {
      case "stars":
        sorted.sort((a, b) => b.stars - a.stars || b.power - a.power);
        break;
      case "level":
        sorted.sort((a, b) => b.level - a.level || b.power - a.power);
        break;
      case "newest":
        break; // API already returns newest-first within rarity
      case "power":
      default:
        sorted.sort((a, b) => b.power - a.power);
    }
    return sorted;
  }, [data, element, minStars, sort]);

  function handleOpened(result: PackOpenResultDTO) {
    setData((prev) =>
      prev
        ? { ...prev, cards: [...result.cards, ...prev.cards], loyaltyPoints: result.loyaltyPoints }
        : prev
    );
    refresh();
  }

  function handleUpgraded(result: UpgradeResultDTO, consumedIds: string[]) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            loyaltyPoints: result.loyaltyPoints,
            cards: prev.cards
              .filter((c) => !consumedIds.includes(c.id))
              .map((c) => (c.id === result.card.id ? result.card : c)),
          }
        : prev
    );
    setUpgrading(null);
    refresh();
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-5xl">🃏</p>
        <h1 className="mt-3 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
          {km ? "បណ្តុំសត្វរបស់ខ្ញុំ" : "My Card Collection"}
        </h1>
        <p className="mt-2 text-sm text-coffee-500 dark:text-cream-300">
          {km
            ? "ចូលគណនីដើម្បីប្រមូលសត្វ បើកកញ្ចប់កាត និងដំឡើងកម្រិត។"
            : "Sign in to collect creatures, open booster packs, and power them up."}
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

  const owned = data?.cards.length ?? 0;
  const strongest = data?.cards.reduce((m, c) => Math.max(m, c.power), 0) ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50">
            🃏 {km ? "បណ្តុំសត្វរបស់ខ្ញុំ" : "My Card Collection"}
          </h1>
          <p className="mt-1 text-sm text-coffee-500 dark:text-cream-300">
            {km
              ? `សត្វ ${owned} ក្បាល · កម្លាំងខ្ពស់បំផុត CP ${strongest}`
              : `${owned} creatures · strongest CP ${strongest}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playSound("click");
            setPackOpen(true);
          }}
          className="btn-tactile flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-crimson-400 px-5 py-2.5 text-sm font-extrabold text-coffee-900 shadow-lg transition-transform hover:scale-105"
        >
          <PackageOpen size={16} />
          {km ? "បើកកញ្ចប់" : "Open Pack"} · {data?.packCost ?? 60} 💎
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <FilterChip
          active={element === "ALL"}
          onClick={() => setElement("ALL")}
          label={km ? "ទាំងអស់" : "All"}
        />
        {ELEMENT_KEYS.map((key) => (
          <FilterChip
            key={key}
            active={element === key}
            onClick={() => setElement(key)}
            label={`${ELEMENTS[key].emoji} ${km ? ELEMENTS[key].nameKm : ELEMENTS[key].nameEn}`}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {[0, 2, 3, 4, 5].map((s) => (
          <FilterChip
            key={s}
            active={minStars === s}
            onClick={() => setMinStars(s)}
            label={s === 0 ? (km ? "គ្រប់កម្រិត" : "Any ★") : `${s}★+`}
          />
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          {SORTS.map((s) => (
            <FilterChip
              key={s.key}
              active={sort === s.key}
              onClick={() => setSort(s.key)}
              label={km ? s.km : s.en}
            />
          ))}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={30} className="animate-spin text-coffee-400" />
        </div>
      ) : visible.length === 0 ? (
        <div className="khmer-card mt-6 rounded-3xl bg-cream-50/70 py-16 text-center dark:bg-coffee-800/50">
          <p className="text-5xl">📦</p>
          <p className="mt-3 font-heading text-base font-bold text-coffee-900 dark:text-cream-50">
            {owned === 0
              ? km
                ? "អ្នកមិនទាន់មានសត្វទេ"
                : "No creatures yet"
              : km
                ? "គ្មានសត្វត្រូវនឹងតម្រង"
                : "Nothing matches those filters"}
          </p>
          {owned === 0 && (
            <button
              type="button"
              onClick={() => setPackOpen(true)}
              className="btn-tactile mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-bold text-white shadow-md"
            >
              <Sparkles size={15} /> {km ? "បើកកញ្ចប់ដំបូង" : "Open your first pack"}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((card) => (
            <CreatureCardTile
              key={card.id}
              card={card}
              km={km}
              onClick={() => {
                playSound("click");
                setUpgrading(card);
              }}
            />
          ))}
        </div>
      )}

      {packOpen && (
        <PackOpenModal km={km} onClose={() => setPackOpen(false)} onOpened={handleOpened} />
      )}
      {upgrading && data && (
        <UpgradeModal
          card={data.cards.find((c) => c.id === upgrading.id) ?? upgrading}
          collection={data.cards}
          diamonds={data.loyaltyPoints}
          km={km}
          onClose={() => setUpgrading(null)}
          onUpgraded={handleUpgraded}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? "bg-coffee-800 text-gold-400"
          : "bg-coffee-100 text-coffee-600 hover:bg-coffee-200 dark:bg-coffee-800 dark:text-cream-300 dark:hover:bg-coffee-700"
      }`}
    >
      {label}
    </button>
  );
}
