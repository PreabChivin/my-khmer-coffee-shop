/**
 * 💌 Café Lounge sticker drawer — a small, curated set of oversized emoji
 * "stickers" (no image assets/CDN needed: emoji render crisp at any size on
 * every platform this app targets, including the Capacitor WebView). Sent as
 * a ChatMessage with kind "STICKER" and the sticker id as `text`; the client
 * renders it large with no bubble background (see ChatDrawer's StickerBubble).
 */
export interface Sticker {
  id: string;
  emoji: string;
  /** Khmer label shown in the picker grid. */
  label: string;
}

export const STICKERS: Sticker[] = [
  { id: "coffee-love", emoji: "☕💖", label: "ស្រលាញ់កាហ្វេ" },
  { id: "vibing", emoji: "🕺💃", label: "Vibe ណាស់" },
  { id: "laugh-cry", emoji: "😭🤣", label: "អស់សំណើច" },
  { id: "fire", emoji: "🔥🔥🔥", label: "ឆេះ!" },
  { id: "hearts", emoji: "💖💕💗", label: "ស្រលាញ់" },
  { id: "bear-hug", emoji: "🧸🤗", label: "សុំក្រសោប" },
  { id: "sparkle", emoji: "✨🌟", label: "ភ្លឺថ្លា" },
  { id: "boba", emoji: "🧋😋", label: "ចង់ផឹក" },
  { id: "skull", emoji: "💀", label: "ស្លាប់សើច" },
  { id: "clap", emoji: "👏👏", label: "ល្អមែន" },
  { id: "cool", emoji: "😎👍", label: "Cool ណាស់" },
  { id: "shy", emoji: "🥹🙈", label: "អៀន" },
];

const STICKER_BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

export function getSticker(id: string): Sticker | undefined {
  return STICKER_BY_ID.get(id);
}
