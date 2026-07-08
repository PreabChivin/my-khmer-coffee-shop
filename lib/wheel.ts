import type { Lang } from "./i18n";

/** 🎡 Wheel of Coffee prizes. `id` is the canonical value stored on the Order
 *  (so admin can aggregate "Most Spun"); km/en are display labels. */
export interface WheelPrize {
  id: string;
  km: string;
  en: string;
  emoji: string;
  color: string;
}

/** Cart subtotal (USD) that unlocks the Vibe Wheel. */
export const SPIN_UNLOCK_THRESHOLD = 3;

export const WHEEL_PRIZES: WheelPrize[] = [
  { id: "free_shot", km: "កាហ្វេបន្ថែម 1 ឥតគិតថ្លៃ", en: "Free Extra Shot", emoji: "☕", color: "#FFB7B2" },
  { id: "free_boba", km: "បុកបាឥតគិតថ្លៃ", en: "Free Boba Topping", emoji: "🧋", color: "#B5EAD7" },
  { id: "discount_10", km: "កូដបញ្ចុះតម្លៃ 10%", en: "10% Discount Code", emoji: "💸", color: "#FFD45A" },
  { id: "sticker_pack", km: "កញ្ចប់ស្ទីកឃ័រ Mascot", en: "Mascot Sticker Pack", emoji: "🧸", color: "#FF85A1" },
];

export function prizeById(id: string | null | undefined): WheelPrize | undefined {
  if (!id) return undefined;
  return WHEEL_PRIZES.find((p) => p.id === id);
}

export function prizeLabel(id: string | null | undefined, lang: Lang): string {
  const prize = prizeById(id);
  if (!prize) return "";
  return `${prize.emoji} ${lang === "km" ? prize.km : prize.en}`;
}
