import type { DrinkCustomization, IceLevel } from "./types";
import type { Lang } from "./i18n";

/** Server-authoritative surcharge per extra espresso shot (USD). */
export const EXTRA_SHOT_PRICE = 0.75;
/** Server-authoritative surcharge for a boba topping (USD). */
export const BOBA_PRICE = 0.5;
export const MAX_SHOTS = 3;
export const SWEETNESS_LEVELS = [0, 25, 50, 100] as const;
export const ICE_LEVELS: IceLevel[] = ["none", "less", "normal", "extra"];

export function isCustomizable(category: string): boolean {
  return category === "Coffee" || category === "Tea";
}

/** Only espresso-based drinks accept extra shots. */
export function allowsShots(category: string): boolean {
  return category === "Coffee";
}

/** 🧋 Boba can top any customizable drink. */
export function allowsBoba(category: string): boolean {
  return isCustomizable(category);
}

export function defaultCustomization(
  category: string
): DrinkCustomization | null {
  if (!isCustomizable(category)) return null;
  return { sweetness: 100, ice: "normal", shots: 0, boba: false };
}

/**
 * Validates and normalizes an untrusted customization payload against the
 * product category, clamping to allowed values. Returns null for
 * non-customizable categories. This is the single source of truth used by the
 * checkout API so a malicious client can never inject arbitrary modifiers or
 * negative shot counts.
 */
export function sanitizeCustomization(
  category: string,
  raw: unknown
): DrinkCustomization | null {
  if (!isCustomizable(category)) return null;
  const fallback = defaultCustomization(category)!;
  if (!raw || typeof raw !== "object") return fallback;

  const input = raw as Partial<DrinkCustomization>;
  const sweetness = SWEETNESS_LEVELS.includes(
    input.sweetness as (typeof SWEETNESS_LEVELS)[number]
  )
    ? (input.sweetness as number)
    : fallback.sweetness;
  const ice = ICE_LEVELS.includes(input.ice as IceLevel)
    ? (input.ice as IceLevel)
    : fallback.ice;
  const rawShots = allowsShots(category) ? Number(input.shots) : 0;
  const shots =
    Number.isInteger(rawShots) && rawShots >= 0
      ? Math.min(rawShots, MAX_SHOTS)
      : 0;
  const boba = allowsBoba(category) ? Boolean(input.boba) : false;

  return { sweetness, ice, shots, boba };
}

export function customizationSurcharge(
  customization: DrinkCustomization | null
): number {
  if (!customization) return 0;
  const shotCost = customization.shots * EXTRA_SHOT_PRICE;
  const bobaCost = customization.boba ? BOBA_PRICE : 0;
  return Math.round((shotCost + bobaCost) * 100) / 100;
}

/** Stable string key so identical customizations collapse to one cart line. */
export function customizationKey(
  customization: DrinkCustomization | null
): string {
  if (!customization) return "plain";
  const { sweetness, ice, shots, boba } = customization;
  return `s${sweetness}-i${ice}-x${shots}-b${boba ? 1 : 0}`;
}

const ICE_LABELS: Record<IceLevel, { en: string; km: string }> = {
  none: { en: "No Ice", km: "គ្មានទឹកកក" },
  less: { en: "Less Ice", km: "ទឹកកកតិច" },
  normal: { en: "Normal Ice", km: "ទឹកកកធម្មតា" },
  extra: { en: "Extra Ice", km: "ទឹកកកច្រើន" },
};

/**
 * Human-readable, localized summary of a customization — used in the cart,
 * order summary, admin kitchen tickets, and the printed thermal receipt.
 */
export function describeCustomization(
  customization: DrinkCustomization | null,
  lang: Lang
): string[] {
  if (!customization) return [];
  const parts: string[] = [];

  parts.push(
    lang === "km"
      ? `ភាពផ្អែម ${customization.sweetness}%`
      : `Sweetness ${customization.sweetness}%`
  );
  parts.push(
    lang === "km"
      ? ICE_LABELS[customization.ice].km
      : ICE_LABELS[customization.ice].en
  );
  if (customization.shots > 0) {
    parts.push(
      lang === "km"
        ? `បន្ថែមកាហ្វេ ${customization.shots} កែវ`
        : `+${customization.shots} Espresso Shot${customization.shots > 1 ? "s" : ""}`
    );
  }
  if (customization.boba) {
    parts.push(lang === "km" ? "បន្ថែមបុកបា 🧋" : "+ Boba 🧋");
  }
  return parts;
}
