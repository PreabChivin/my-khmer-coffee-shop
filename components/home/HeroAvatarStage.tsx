"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import AvatarPortrait from "@/components/avatar/AvatarPortrait";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ShopItemDTO } from "@/lib/types";

/**
 * 🌟 Big animated hero avatar stage. Reuses the existing 2D layered-art
 * AvatarPortrait — see the missions-avatar-shop project memory: a real 3D
 * engine was built, iterated on 4 times, and fully reverted because no real
 * sculpted 3D character assets exist. That gap is still true, so this stays
 * 2D and gets its "wow" from motion/glow (rotating gradient ring, float,
 * twinkle sparkles) instead of re-attempting 3D.
 */
export default function HeroAvatarStage() {
  const { user } = useSession();
  const { openAuth } = useAuthModal();
  const { lang } = useLanguage();
  const km = lang === "km";
  const [items, setItems] = useState<ShopItemDTO[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/shop/items")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ShopItemDTO[] | null) => {
        if (!cancelled && data) setItems(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const baseCharacter = useMemo(() => {
    const it = items?.find((i) => i.category === "BASE_CHARACTER" && i.equipped);
    return it
      ? { category: it.category, emoji: it.emoji, imageUrl: it.imageUrl, imageOffset: it.imageOffset }
      : null;
  }, [items]);

  const equippedLayers = useMemo(
    () =>
      (items ?? [])
        .filter((i) => i.equipped && i.category !== "BASE_CHARACTER")
        .map((i) => ({
          category: i.category,
          emoji: i.emoji,
          imageUrl: i.imageUrl,
          imageOffset: i.imageOffset,
        })),
    [items]
  );

  return (
    <div className="relative mx-auto flex w-fit flex-col items-center">
      <div className="story-ring animate-float-cute rounded-2xl">
        <AvatarPortrait baseCharacter={baseCharacter} equipped={equippedLayers} height={200} />
      </div>
      <span className="pointer-events-none absolute -right-3 -top-2 animate-twinkle text-2xl">✨</span>
      <span
        className="pointer-events-none absolute -left-3 top-8 animate-twinkle text-xl"
        style={{ animationDelay: "0.5s" }}
      >
        ⭐
      </span>

      {!user && (
        <button
          type="button"
          onClick={openAuth}
          className="btn-tactile mt-3 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
        >
          <Sparkles size={12} /> {km ? "ចូលគណនីតុបតែងតួអង្គ" : "Sign in to customize"}
        </button>
      )}
    </div>
  );
}
