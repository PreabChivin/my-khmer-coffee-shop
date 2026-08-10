"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TIER_RING_CLASS } from "@/lib/shopTiers";
import AvatarPortrait from "@/components/avatar/AvatarPortrait";
import PublicPlayerModal from "@/components/games/PublicPlayerModal";
import type { ShopItemDTO } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

type Category = "ALL" | ShopItemDTO["category"];

const CATEGORIES: { key: Category; labelKey: TranslationKey }[] = [
  { key: "ALL", labelKey: "shop.categoryAll" },
  { key: "BASE_CHARACTER", labelKey: "shop.categoryCharacter" },
  { key: "HAT", labelKey: "shop.categoryHat" },
  { key: "EYEWEAR", labelKey: "shop.categoryEyewear" },
  { key: "OUTFIT", labelKey: "shop.categoryOutfit" },
  { key: "HANDHELD", labelKey: "shop.categoryHandheld" },
];

export default function AvatarShop() {
  const { user, refresh } = useSession();
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<ShopItemDTO[]>([]);
  const [category, setCategory] = useState<Category>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadItems() {
    try {
      const res = await fetch("/api/shop/items");
      if (res.ok) setItems(await res.json());
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetch("/api/shop/items")
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const [showOwnProfile, setShowOwnProfile] = useState(false);

  const points = user?.loyaltyPoints ?? 0;
  const baseItem = useMemo(
    () => items.find((i) => i.category === "BASE_CHARACTER" && i.equipped) ?? null,
    [items]
  );
  const equippedLayers = useMemo(
    () =>
      items
        .filter((i) => i.equipped && i.category !== "BASE_CHARACTER")
        .map((i) => ({
          category: i.category,
          emoji: i.emoji,
          imageUrl: i.imageUrl,
          imageOffset: i.imageOffset,
        })),
    [items]
  );
  const visibleItems = useMemo(
    () => (category === "ALL" ? items : items.filter((i) => i.category === category)),
    [items, category]
  );

  async function buy(item: ShopItemDTO) {
    setBusyId(item.id);
    setMsg(null);
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? t("shop.buyError") });
        return;
      }
      setMsg({ ok: true, text: `${item.emoji} ${t("shop.buySuccess")}` });
      await refresh();
      await loadItems();
    } catch {
      setMsg({ ok: false, text: t("shop.networkError") });
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEquip(item: ShopItemDTO) {
    setBusyId(item.id);
    setMsg(null);
    try {
      const res = await fetch("/api/shop/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, equip: !item.equipped }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? t("shop.buyError") });
        return;
      }
      await loadItems();
    } catch {
      setMsg({ ok: false, text: t("shop.networkError") });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
        {t("shop.title")}
      </h2>

      <div className="relative mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-cream-50 py-4 dark:bg-coffee-800">
        <AvatarPortrait
          baseCharacter={
            baseItem
              ? {
                  category: "BASE_CHARACTER",
                  emoji: baseItem.emoji,
                  imageUrl: baseItem.imageUrl,
                  imageOffset: baseItem.imageOffset,
                }
              : null
          }
          equipped={equippedLayers}
          height={300}
        />
        {user && (
          <button
            type="button"
            onClick={() => setShowOwnProfile(true)}
            className="btn-tactile absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-coffee-900/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Eye size={12} />
            {t("shop.previewProfile")}
          </button>
        )}
      </div>

      {showOwnProfile && user && (
        <PublicPlayerModal userId={user.id} onClose={() => setShowOwnProfile(false)} />
      )}

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              category === c.key
                ? "bg-gradient-to-r from-clay-400 to-crimson-400 text-white"
                : "bg-cream-100 text-coffee-500 dark:bg-coffee-800 dark:text-cream-300"
            }`}
          >
            {t(c.labelKey)}
          </button>
        ))}
      </div>

      {msg && (
        <p
          className={`mb-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            msg.ok
              ? "bg-matcha-100 text-matcha-700"
              : "bg-crimson-50 text-crimson-600 dark:bg-coffee-950"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleItems.length === 0 && (
          <p className="col-span-full rounded-2xl border-2 border-dashed border-coffee-300 px-6 py-8 text-center text-sm text-coffee-400 dark:border-coffee-600 dark:text-cream-400">
            {t("shop.empty")}
          </p>
        )}
        {visibleItems.map((item) => {
          const affordable = points >= item.cost;
          const busy = busyId === item.id;
          return (
            <div
              key={item.id}
              className={`khmer-card flex flex-col items-center gap-1.5 rounded-2xl bg-cream-50 p-3 text-center ring-2 dark:bg-coffee-800 ${TIER_RING_CLASS[item.tier]}`}
            >
              <span className="relative text-3xl drop-shadow-sm">
                {item.emoji}
                {item.equipped && (
                  <span
                    aria-label={t("shop.equippedBadge")}
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-matcha-500 text-[9px] text-white ring-2 ring-cream-50 dark:ring-coffee-900"
                  >
                    ✓
                  </span>
                )}
              </span>
              <p className="line-clamp-1 font-heading text-xs font-bold text-coffee-900 dark:text-cream-50">
                {lang === "km" ? item.nameKh : item.name}
              </p>
              {!item.owned && (
                <p className="text-[11px] font-bold text-clay-600 dark:text-clay-400">
                  {item.cost.toLocaleString()} 💎
                </p>
              )}
              {item.owned ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleEquip(item)}
                  className={`mt-1 w-full rounded-full px-2 py-1.5 text-[11px] font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed ${
                    item.equipped
                      ? "bg-matcha-500 text-white"
                      : "bg-gradient-to-r from-clay-400 to-crimson-400 text-white"
                  }`}
                >
                  {busy ? "..." : item.equipped ? t("shop.unequipBtn") : t("shop.equipBtn")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!user || !affordable || busy}
                  onClick={() => buy(item)}
                  className="mt-1 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:from-coffee-200 disabled:to-coffee-200 disabled:text-coffee-400"
                >
                  {busy ? "..." : affordable ? t("shop.buyBtn") : t("shop.notEnough")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
