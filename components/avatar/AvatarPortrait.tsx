import type { ImageOffset, ShopItemCategory } from "@/lib/types";

export interface AvatarLayer {
  category: ShopItemCategory;
  emoji: string;
  imageUrl: string | null;
  imageOffset: ImageOffset | null;
}

interface AvatarPortraitProps {
  /** The equipped BASE_CHARACTER item, or null if none equipped yet. */
  baseCharacter: AvatarLayer | null;
  /** Equipped HAT/EYEWEAR/OUTFIT/HANDHELD layers. */
  equipped: AvatarLayer[];
  /** Portrait height in px — width follows via a 3:4 aspect ratio, matching
   *  the full-body-portrait format this art style is normally drawn in. */
  height?: number;
}

// 📍 Where an item's EMOJI badge sits when it has no real art yet — a small
// unobtrusive indicator near the body part it occupies, so equipping still
// gives visible feedback instead of nothing. Real art (once sourced)
// ignores this entirely and renders full-bleed over the portrait instead.
const BADGE_POSITION: Record<ShopItemCategory, string> = {
  HAT: "left-1/2 top-[6%] -translate-x-1/2",
  EYEWEAR: "left-1/2 top-[26%] -translate-x-1/2",
  OUTFIT: "left-1/2 top-[52%] -translate-x-1/2",
  HANDHELD: "right-[8%] top-[62%]",
  BASE_CHARACTER: "",
};

/** Turns an { xPercent, yPercent, scalePercent } override into a CSS
 *  transform — additive on top of the layer's default full-bleed position,
 *  for asset packs whose layers weren't pre-aligned to one shared canvas. */
function offsetStyle(offset: ImageOffset | null): React.CSSProperties {
  if (!offset) return {};
  const { xPercent = 0, yPercent = 0, scalePercent = 100 } = offset;
  return { transform: `translate(${xPercent}%, ${yPercent}%) scale(${scalePercent / 100})` };
}

/**
 * 🖼️ The 2D layered avatar — a full-body character portrait with equipped
 * items stacked on top, matching the "cute chibi doll" reference art style
 * (a purchased/sourced illustration, not something this component can draw
 * itself). Two rendering modes per layer, chosen automatically:
 *
 * 1. **Real art** (`imageUrl` set) — rendered `absolute inset-0` with
 *    `object-fit: contain`, so it stacks directly on the base portrait.
 *    This assumes the standard 2D-avatar-asset-pack convention: every
 *    layer (hair options, outfit options, ...) is pre-drawn to the SAME
 *    canvas/alignment as the base character, so no per-item positioning is
 *    normally needed — the artist already handled it. For the rare pack
 *    that ISN'T pre-aligned, `imageOffset` nudges an individual layer.
 * 2. **No art yet** (current state for every item — none has been sourced,
 *    see public/images/avatars/README.md) — falls back to a small emoji
 *    badge near the relevant body part, so equipping is still visibly
 *    reflected without a broken/blank layer.
 *
 * The base character itself falls back to a large centered emoji on a soft
 * card if no BASE_CHARACTER is equipped or it has no art yet — the 2D
 * equivalent of the old AvatarStage's generation-emoji fallback.
 */
export default function AvatarPortrait({ baseCharacter, equipped, height = 300 }: AvatarPortraitProps) {
  const width = Math.round((height * 3) / 4);

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl bg-gradient-to-b from-cream-100 to-clay-100 dark:from-coffee-900 dark:to-coffee-800"
      style={{ height, width }}
    >
      {baseCharacter?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={baseCharacter.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl drop-shadow-lg">{baseCharacter?.emoji ?? "🧑‍🍳"}</span>
        </div>
      )}

      {equipped.map((item) =>
        item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.category}
            src={item.imageUrl}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            style={offsetStyle(item.imageOffset)}
          />
        ) : (
          <span
            key={item.category}
            aria-hidden
            className={`pointer-events-none absolute flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-lg shadow-md ring-2 ring-white/60 dark:bg-coffee-950/85 ${BADGE_POSITION[item.category]}`}
          >
            {item.emoji}
          </span>
        )
      )}
    </div>
  );
}
