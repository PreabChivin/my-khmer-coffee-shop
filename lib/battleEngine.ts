/**
 * ⚔️ Battle math -- pure functions, no React and no Prisma, same
 * separation as lib/cardEngine.ts / lib/quizEngine.ts. Every roll here
 * (damage variance) runs SERVER-SIDE only inside app/api/battle/*.
 */
import { elementalMatchup, type Element, type MatchupLabel } from "@/lib/creatures";

export const DECK_SIZE = 8;

/** HP pool per creature, derived from its battle-time CP. Tuned so a
 *  neutral matchup between similarly-powered creatures takes 2-3 hits to
 *  knock out, and a Super Effective hit meaningfully swings a fight without
 *  ever being a guaranteed one-shot. */
const HP_PER_CP = 2.2;

/** Small variance so identical matchups do not play out identically every
 *  time -- keeps damage between roughly SUPER*0.9 and SUPER*1.1 etc. */
const DAMAGE_VARIANCE_MIN = 0.9;
const DAMAGE_VARIANCE_MAX = 1.1;

export const WIN_REWARD_POINTS = 40;
export const LOSS_REWARD_POINTS = 10;
export const WIN_EXP_PER_CARD = 15;
export const LOSS_EXP_PER_CARD = 5;

export interface BattleRosterCard {
  cardId: string;
  speciesId: string;
  element: Element;
  stars: number;
  /** CP at the moment the match started -- frozen for the whole battle. */
  power: number;
  maxHp: number;
  hp: number;
  fainted: boolean;
}

export function maxHpFor(power: number): number {
  return Math.max(10, Math.round(power * HP_PER_CP));
}

export function buildRosterCard(card: {
  id: string;
  speciesId: string;
  element: Element;
  stars: number;
  power: number;
}): BattleRosterCard {
  const maxHp = maxHpFor(card.power);
  return {
    cardId: card.id,
    speciesId: card.speciesId,
    element: card.element,
    stars: card.stars,
    power: card.power,
    maxHp,
    hp: maxHp,
    fainted: false,
  };
}

export interface AttackResult {
  damage: number;
  multiplier: number;
  label: MatchupLabel;
  defenderFainted: boolean;
}

/** Damage for one ATTACK action. `attackerPower` already encodes level +
 *  star rarity (see lib/cardEngine.powerOf) -- the elemental multiplier and
 *  a small random variance are the only battle-specific factors on top. */
export function resolveAttack(
  attackerPower: number,
  attackerElement: Element,
  defender: BattleRosterCard
): AttackResult {
  const { multiplier, label } = elementalMatchup(attackerElement, defender.element);
  const variance = DAMAGE_VARIANCE_MIN + Math.random() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  const damage = Math.max(1, Math.round(attackerPower * multiplier * variance));
  return {
    damage,
    multiplier,
    label,
    defenderFainted: defender.hp - damage <= 0,
  };
}

/** First bench slot (in deck order) that has not fainted yet, for
 *  auto-promoting a new active the instant the current one is knocked out. */
export function nextAliveIndex(roster: BattleRosterCard[], skip: number): number {
  for (let i = 0; i < roster.length; i++) {
    if (i !== skip && !roster[i].fainted) return i;
  }
  return -1;
}

export function isTeamDefeated(roster: BattleRosterCard[]): boolean {
  return roster.every((c) => c.fainted);
}
