import { generationFromDOB } from "@/lib/generation";
import type { ShopItemTier } from "@prisma/client";

export interface AvatarEquippedLayer {
  category: "HAT" | "EYEWEAR" | "OUTFIT" | "HANDHELD";
  emoji: string;
  tier?: ShopItemTier;
}

interface AvatarStageProps {
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  equipped: AvatarEquippedLayer[];
  size?: number;
}

/** Tier accent — reused by both the outfit ring here and the item-card
 *  border in AvatarShop, so a rarity always reads the same color. */
export const TIER_RING_CLASS: Record<ShopItemTier, string> = {
  COMMON: "ring-coffee-300 dark:ring-coffee-600",
  RARE: "ring-lavender-400 dark:ring-lavender-500",
  EPIC: "ring-crimson-400 dark:ring-crimson-500",
  LEGENDARY: "ring-gold-500 dark:ring-gold-400",
};

/** 🎩 The reusable 2D layered avatar preview: a circular base (the user's
 *  profile photo, or their generation emoji as a fallback — same idiom
 *  ChatDrawer already uses for message avatars) with up to 4 equipped
 *  emoji layers composited around it. Pure presentational — no fetching,
 *  no state — so both AvatarShop's live try-on and any future profile
 *  display can reuse it. CSS/emoji only, no new dependency. */
export default function AvatarStage({
  avatarUrl,
  dateOfBirth,
  equipped,
  size = 96,
}: AvatarStageProps) {
  const fallbackEmoji = generationFromDOB(dateOfBirth ?? null)?.emoji ?? "☕";
  const hat = equipped.find((e) => e.category === "HAT");
  const eyewear = equipped.find((e) => e.category === "EYEWEAR");
  const outfit = equipped.find((e) => e.category === "OUTFIT");
  const handheld = equipped.find((e) => e.category === "HANDHELD");
  const ringClass = outfit?.tier
    ? TIER_RING_CLASS[outfit.tier]
    : "ring-cream-200 dark:ring-coffee-700";

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Soft contrast halo — same idiom as Pet Zoo's critter glow. */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 scale-90 rounded-full bg-white/50 blur-lg dark:bg-coffee-950/40"
      />

      <div
        className={`relative h-full w-full overflow-hidden rounded-full bg-clay-100 ring-4 dark:bg-coffee-900 ${ringClass}`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center"
            style={{ fontSize: size * 0.5 }}
          >
            {fallbackEmoji}
          </span>
        )}
      </div>

      {hat && (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 drop-shadow-md"
          style={{ top: -size * 0.22, fontSize: size * 0.42 }}
        >
          {hat.emoji}
        </span>
      )}

      {eyewear && (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 drop-shadow-sm"
          style={{ top: size * 0.32, fontSize: size * 0.3 }}
        >
          {eyewear.emoji}
        </span>
      )}

      {handheld && (
        <span
          aria-hidden
          className="absolute flex items-center justify-center rounded-full bg-white/90 shadow ring-2 ring-cream-50 dark:bg-coffee-800 dark:ring-coffee-900"
          style={{
            bottom: -size * 0.06,
            right: -size * 0.06,
            width: size * 0.36,
            height: size * 0.36,
            fontSize: size * 0.2,
          }}
        >
          {handheld.emoji}
        </span>
      )}
    </div>
  );
}
