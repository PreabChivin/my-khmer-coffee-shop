/**
 * 🃏 Creature roster — ORIGINAL creatures authored for this site.
 *
 * Deliberately not Pokémon (or any other licensed franchise): those names
 * and designs are trademarked, this is a public commercial site, and the
 * rights-holders enforce. Everything here is original IP belonging to
 * BENCHIMIN ARCADE, so the whole card game is safe to ship and to monetise.
 *
 * Static content in code, same convention as lib/missions.ts and
 * lib/quizQuestions.ts — no species table to keep in sync, no admin CRUD.
 * Only a player's OWNED instances live in Postgres (model CreatureCard).
 *
 * Art is drawn procedurally in SVG from the palette below (see
 * components/cards/CreatureCardArt.tsx). There is no image-generation tool
 * in this environment and no illustrated asset pack has been sourced, so
 * geometric-but-styled art is the honest ceiling here — the same constraint
 * that ended the 3D avatar attempt (see the missions-avatar-shop memory).
 */

export type Element = "FIRE" | "WATER" | "GRASS" | "STORM" | "SHADOW" | "LIGHT";

export interface ElementMeta {
  key: Element;
  nameEn: string;
  nameKm: string;
  emoji: string;
  /** [from, to] — drives every gradient for this element's card art. */
  colors: [string, string];
  /** Element this one is strong against (used by the battle arena). */
  beats: Element;
}

export const ELEMENTS: Record<Element, ElementMeta> = {
  FIRE: {
    key: "FIRE",
    nameEn: "Fire",
    nameKm: "ភ្លើង",
    emoji: "🔥",
    colors: ["#ff8a3d", "#e0245e"],
    beats: "GRASS",
  },
  WATER: {
    key: "WATER",
    nameEn: "Water",
    nameKm: "ទឹក",
    emoji: "💧",
    colors: ["#3dc8ff", "#2b6ee0"],
    beats: "FIRE",
  },
  GRASS: {
    key: "GRASS",
    nameEn: "Grass",
    nameKm: "រុក្ខជាតិ",
    emoji: "🌿",
    colors: ["#7fe08a", "#1f9d55"],
    beats: "STORM",
  },
  STORM: {
    key: "STORM",
    nameEn: "Storm",
    nameKm: "ព្យុះ",
    emoji: "⚡",
    colors: ["#ffe066", "#f0932b"],
    beats: "WATER",
  },
  SHADOW: {
    key: "SHADOW",
    nameEn: "Shadow",
    nameKm: "ស្រមោល",
    emoji: "🌑",
    colors: ["#a06bff", "#4b2d8f"],
    beats: "LIGHT",
  },
  LIGHT: {
    key: "LIGHT",
    nameEn: "Light",
    nameKm: "ពន្លឺ",
    emoji: "✨",
    colors: ["#fff3a8", "#ffb02e"],
    beats: "SHADOW",
  },
};

export const ELEMENT_KEYS = Object.keys(ELEMENTS) as Element[];

/** Shape hint consumed by the SVG art component — keeps the roster data
 *  purely declarative instead of hard-coding a drawing per species. */
export type BodyShape = "beast" | "wyrm" | "avian" | "aquatic" | "bloom" | "spirit";

export interface Species {
  id: string;
  nameEn: string;
  nameKm: string;
  element: Element;
  shape: BodyShape;
  /** Silhouette accent emoji, shown alongside the drawn art. */
  emoji: string;
  /** Base CP is rolled inside this range before the star multiplier. */
  cpRange: [number, number];
  /** Relative pull weight — higher shows up more often. */
  weight: number;
  loreEn: string;
  loreKm: string;
}

export const CREATURES: Species[] = [
  {
    id: "emberpaw",
    nameEn: "Emberpaw",
    nameKm: "អេមប៊ើផៅ",
    element: "FIRE",
    shape: "beast",
    emoji: "🐈‍⬛",
    cpRange: [40, 70],
    weight: 100,
    loreEn: "A cinder-furred prowler that leaves glowing pawprints.",
    loreKm: "សត្វព្រានរោមភ្លើង ដែលទុកស្នាមជើងភ្លឺៗ។",
  },
  {
    id: "volcanix",
    nameEn: "Volcanix",
    nameKm: "វុលកានីក",
    element: "FIRE",
    shape: "wyrm",
    emoji: "🐉",
    cpRange: [70, 120],
    weight: 45,
    loreEn: "Sleeps in magma chambers; wakes only for a worthy rival.",
    loreKm: "ដេកក្នុងបំពង់ម៉ាកម៉ា ភ្ញាក់ឡើងតែពេលជួបគូប្រកួតសក្តិសម។",
  },
  {
    id: "tidefin",
    nameEn: "Tidefin",
    nameKm: "ថៃដ៍ហ្វិន",
    element: "WATER",
    shape: "aquatic",
    emoji: "🐟",
    cpRange: [38, 66],
    weight: 100,
    loreEn: "Rides river currents and never swims the same route twice.",
    loreKm: "ជិះលំហូរទន្លេ ហើយមិនដែលហែលផ្លូវដដែលពីរដងទេ។",
  },
  {
    id: "glacierhorn",
    nameEn: "Glacierhorn",
    nameKm: "ក្លាស៊ីអឺហន",
    element: "WATER",
    shape: "beast",
    emoji: "🦬",
    cpRange: [72, 118],
    weight: 42,
    loreEn: "Its horns fog the air with frost on every breath.",
    loreKm: "ស្នែងរបស់វាធ្វើឲ្យខ្យល់ត្រជាក់រាល់ដងដកដង្ហើម។",
  },
  {
    id: "thornvine",
    nameEn: "Thornvine",
    nameKm: "ថនវ៉ាញ",
    element: "GRASS",
    shape: "bloom",
    emoji: "🌱",
    cpRange: [36, 64],
    weight: 100,
    loreEn: "Grows a fresh thorn for every battle it survives.",
    loreKm: "ដុះបន្លាថ្មីមួយរាល់ការប្រកួតដែលវារស់រានមានជីវិត។",
  },
  {
    id: "bloomstag",
    nameEn: "Bloomstag",
    nameKm: "ប្លូមស្តាហ្គ",
    element: "GRASS",
    shape: "beast",
    emoji: "🦌",
    cpRange: [68, 112],
    weight: 44,
    loreEn: "Flowers bloom in its tracks, even out of season.",
    loreKm: "ផ្កាចេញតាមដានជើងវា ទោះក្រៅរដូវក៏ដោយ។",
  },
  {
    id: "sparkquill",
    nameEn: "Sparkquill",
    nameKm: "ស្ពាកគ្វីល",
    element: "STORM",
    shape: "avian",
    emoji: "🐦",
    cpRange: [42, 72],
    weight: 95,
    loreEn: "Each feather holds a charge; a full flock is a thunderhead.",
    loreKm: "រោមនីមួយៗផ្ទុកចរន្ត ហ្វូងពេញមួយគឺជាពពករន្ទះ។",
  },
  {
    id: "zaptalon",
    nameEn: "Zaptalon",
    nameKm: "សាបថាឡុន",
    element: "STORM",
    shape: "avian",
    emoji: "🦅",
    cpRange: [74, 122],
    weight: 40,
    loreEn: "Dives faster than the sound of its own thunder.",
    loreKm: "ស្ទុះលឿនជាងសំឡេងផ្គររបស់ខ្លួនឯង។",
  },
  {
    id: "umbrafang",
    nameEn: "Umbrafang",
    nameKm: "អាំប្រាហ្វាង",
    element: "SHADOW",
    shape: "beast",
    emoji: "🐺",
    cpRange: [44, 76],
    weight: 85,
    loreEn: "Hunts by starlight and is never seen leaving.",
    loreKm: "ប្រមាញ់ក្រោមពន្លឺផ្កាយ ហើយគ្មាននរណាឃើញវាចាកចេញ។",
  },
  {
    id: "nightveil",
    nameEn: "Nightveil",
    nameKm: "ណៃវែល",
    element: "SHADOW",
    shape: "spirit",
    emoji: "🦇",
    cpRange: [76, 126],
    weight: 34,
    loreEn: "Folds shadows around itself like a second pair of wings.",
    loreKm: "បត់ស្រមោលព័ទ្ធខ្លួន ដូចស្លាបទីពីរ។",
  },
  {
    id: "solaris",
    nameEn: "Solaris",
    nameKm: "សូឡារីស",
    element: "LIGHT",
    shape: "avian",
    emoji: "🔆",
    cpRange: [46, 80],
    weight: 80,
    loreEn: "Reborn from its own warmth every sunrise.",
    loreKm: "កើតជាថ្មីពីកម្តៅខ្លួនឯងរាល់ព្រឹកព្រះអាទិត្យរះ។",
  },
  {
    id: "aurelion",
    nameEn: "Aurelion",
    nameKm: "អូរេលីយ៉ុន",
    element: "LIGHT",
    shape: "beast",
    emoji: "🦁",
    cpRange: [80, 132],
    weight: 30,
    loreEn: "Its mane is said to be woven from captured dawn.",
    loreKm: "សក់កររបស់វាគេថាត្បាញពីពន្លឺព្រឹកដែលចាប់បាន។",
  },
];

const BY_ID = new Map(CREATURES.map((c) => [c.id, c]));

export function getSpecies(id: string): Species | undefined {
  return BY_ID.get(id);
}
