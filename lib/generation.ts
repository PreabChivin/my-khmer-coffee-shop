/**
 * 🎂 Generation classifier — maps a date of birth to a generation tier using
 * the standard birth-year ranges, and attaches a fun, personalized Khmer
 * blurb per tier (playful Gen-Z slang for the young, warm nostalgia for the
 * older tiers). Pure + isomorphic so both the API and the UI agree.
 */

export type GenerationKey = "ALPHA" | "GEN_Z" | "GEN_Y" | "GEN_X" | "BOOMER";

export interface GenerationInfo {
  key: GenerationKey;
  /** Short display label, e.g. "Gen Z". */
  label: string;
  /** Khmer label. */
  km: string;
  emoji: string;
  /** Fun, personalized Khmer blurb for the profile card. */
  slang: string;
  /** Birth-year range shown as context. */
  range: string;
}

const GENERATIONS: Record<GenerationKey, Omit<GenerationInfo, "key">> = {
  ALPHA: {
    label: "Gen Alpha",
    km: "ជេន អាល់ហ្វា",
    emoji: "🐣",
    slang: "iPad Kid តូចៗ តែ smart ស្តូក! អនាគតជាតិយើងហ្នឹង ✨📱",
    range: "2013–present",
  },
  GEN_Z: {
    label: "Gen Z",
    km: "ជេន ហ្ស៊ី",
    emoji: "💅",
    slang: "Vibe ពេញ ១០០ ម៉ាយដំឡូង! main character ស្តូក no cap 🔥💯",
    range: "1997–2012",
  },
  GEN_Y: {
    label: "Millennials",
    km: "ជេន វ៉ាយ (មីលេនញ៉ល)",
    emoji: "☕",
    slang: "អ្នកចាស់ទាន់សម័យ ស្រឡាញ់កាហ្វេ chill ៗ និង throwback ផ្អែមៗ 🥺💛",
    range: "1981–1996",
  },
  GEN_X: {
    label: "Gen X",
    km: "ជេន អ៊ិច",
    emoji: "🎸",
    slang: "ស្ងប់ស្ងាត់ តែ cool ជ្រៅ បទពិសោធន៍ពេញដៃ គោរពខ្លាំង 🙌",
    range: "1965–1980",
  },
  BOOMER: {
    label: "Baby Boomer",
    km: "ជំនាន់មុន",
    emoji: "🧓",
    slang: "ចាស់ទុំ ប្រាជ្ញាពេញ ជាទីគោរពបំផុតរបស់ពួកយើង 💖🌿",
    range: "before 1965",
  },
};

export function generationFromBirthYear(year: number): GenerationInfo {
  let key: GenerationKey;
  if (year >= 2013) key = "ALPHA";
  else if (year >= 1997) key = "GEN_Z";
  else if (year >= 1981) key = "GEN_Y";
  else if (year >= 1965) key = "GEN_X";
  else key = "BOOMER";
  return { key, ...GENERATIONS[key] };
}

/** Returns null when no (valid) date of birth is on file. */
export function generationFromDOB(
  dob: Date | string | null | undefined
): GenerationInfo | null {
  if (!dob) return null;
  const date = dob instanceof Date ? dob : new Date(dob);
  const year = date.getUTCFullYear();
  if (!Number.isFinite(year) || year < 1900 || year > new Date().getUTCFullYear()) {
    return null;
  }
  return generationFromBirthYear(year);
}

/** Age in whole years from a date of birth (null when unknown/invalid). */
export function ageFromDOB(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  const date = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const m = now.getUTCMonth() - date.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < date.getUTCDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}
