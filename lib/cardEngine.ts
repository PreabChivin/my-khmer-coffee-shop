/**
 * 🎲 Creature card math — pure functions, no React and no Prisma, so the
 * pack/upgrade API routes and the UI share one source of truth (same
 * separation as lib/ticTacToe.ts, lib/rps.ts and lib/quizEngine.ts).
 *
 * Every roll here runs SERVER-SIDE only. The client never reports what it
 * pulled or how much power it gained — it just renders what came back.
 */
import { CREATURES, getSpecies, type Species } from "@/lib/creatures";

export const MAX_LEVEL = 100;
export const PACK_SIZE = 5;
/** Booster pack price, in Diamonds (User.loyaltyPoints — never a 2nd currency). */
export const PACK_COST = 60;
/** Diamonds spent on "POWER UP" convert to EXP at this rate. */
export const DIAMOND_TO_EXP = 3;
const SHINY_CHANCE = 0.03;
/** Shiny is a flat power bonus on top of the star multiplier. */
const SHINY_CP_BONUS = 0.15;

export type Stars = 1 | 2 | 3 | 4 | 5;

/** Pull weights per star. Deliberately steep at 5★ so a Legendary actually
 *  feels like one — see PACK_GUARANTEE_MIN_STARS for the pity floor. */
const STAR_WEIGHTS: { stars: Stars; weight: number }[] = [
  { stars: 1, weight: 45 },
  { stars: 2, weight: 30 },
  { stars: 3, weight: 17 },
  { stars: 4, weight: 6 },
  { stars: 5, weight: 2 },
];

const STAR_CP_MULTIPLIER: Record<Stars, number> = {
  1: 1,
  2: 1.25,
  3: 1.6,
  4: 2.1,
  5: 2.8,
};

export const STAR_LABEL: Record<Stars, { en: string; km: string }> = {
  1: { en: "Common", km: "ធម្មតា" },
  2: { en: "Uncommon", km: "មិនធម្មតា" },
  3: { en: "Rare", km: "កម្រ" },
  4: { en: "Epic", km: "អេពិក" },
  5: { en: "Legendary", km: "រឿងព្រេង" },
};

/** Every pack contains at least one card of this rarity or better. */
const PACK_GUARANTEE_MIN_STARS: Stars = 2;

function weightedPick<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (const entry of items) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return items[items.length - 1].item;
}

export function rollStars(minStars: Stars = 1): Stars {
  const pool = STAR_WEIGHTS.filter((s) => s.stars >= minStars);
  return weightedPick(pool.map((s) => ({ item: s.stars, weight: s.weight })));
}

export function rollSpecies(): Species {
  return weightedPick(CREATURES.map((c) => ({ item: c, weight: c.weight })));
}

/** Base CP for a fresh pull — random inside the species band, then scaled by
 *  star rating. Two identical species/star cards still differ, which is what
 *  makes duplicates worth pulling. */
export function rollBaseCp(species: Species, stars: Stars, isShiny: boolean): number {
  const [lo, hi] = species.cpRange;
  const raw = lo + Math.random() * (hi - lo);
  const scaled = raw * STAR_CP_MULTIPLIER[stars] * (isShiny ? 1 + SHINY_CP_BONUS : 1);
  return Math.round(scaled);
}

export function rollShiny(): boolean {
  return Math.random() < SHINY_CHANCE;
}

export interface RolledCard {
  speciesId: string;
  stars: Stars;
  baseCp: number;
  isShiny: boolean;
}

/** One booster pack: PACK_SIZE cards, at least one of which clears the
 *  guarantee floor so a pack is never a total write-off. */
export function rollPack(): RolledCard[] {
  const cards: RolledCard[] = [];
  for (let i = 0; i < PACK_SIZE; i++) {
    // Last slot upgrades to the guaranteed floor only if nothing already hit it.
    const needsGuarantee =
      i === PACK_SIZE - 1 && !cards.some((c) => c.stars >= PACK_GUARANTEE_MIN_STARS);
    const stars = rollStars(needsGuarantee ? PACK_GUARANTEE_MIN_STARS : 1);
    const species = rollSpecies();
    const isShiny = rollShiny();
    cards.push({
      speciesId: species.id,
      stars,
      baseCp: rollBaseCp(species, stars, isShiny),
      isShiny,
    });
  }
  return cards;
}

/** EXP needed to go from `level` to `level + 1`. */
export function expToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return 60 + (level - 1) * 30;
}

/** Combat Power at the card's current level. */
export function powerOf(card: { baseCp: number; level: number }): number {
  return Math.round(card.baseCp * (1 + (card.level - 1) * 0.045));
}

/** EXP released by sacrificing a card in the upgrade screen. */
export function feedExpValue(card: { stars: number; level: number }): number {
  return 30 * card.stars + card.level * 6;
}

export interface LevelResult {
  level: number;
  exp: number;
  levelsGained: number;
}

/** Applies EXP, rolling over as many levels as it covers and hard-capping
 *  at MAX_LEVEL (surplus EXP past the cap is intentionally discarded). */
export function applyExp(level: number, exp: number, gained: number): LevelResult {
  let nextLevel = level;
  let nextExp = exp + Math.max(0, gained);
  let levelsGained = 0;

  while (nextLevel < MAX_LEVEL) {
    const need = expToNextLevel(nextLevel);
    if (nextExp < need) break;
    nextExp -= need;
    nextLevel += 1;
    levelsGained += 1;
  }
  if (nextLevel >= MAX_LEVEL) {
    nextLevel = MAX_LEVEL;
    nextExp = 0;
  }
  return { level: nextLevel, exp: nextExp, levelsGained };
}

/** Convenience for the collection UI — everything it needs to draw a card. */
export function describeCard(card: {
  speciesId: string;
  stars: number;
  baseCp: number;
  level: number;
  exp: number;
}) {
  const species = getSpecies(card.speciesId);
  return {
    species,
    power: powerOf(card),
    expNeeded: expToNextLevel(card.level),
  };
}
