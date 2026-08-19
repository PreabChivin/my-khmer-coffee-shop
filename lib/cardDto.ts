import type { CreatureCard } from "@prisma/client";
import { getSpecies } from "@/lib/creatures";
import { expToNextLevel, powerOf } from "@/lib/cardEngine";
import type { CreatureCardDTO } from "@/lib/types";

/**
 * Flattens an owned CreatureCard row together with its (code-side) species
 * definition and the derived power/EXP figures, so no client ever has to
 * re-implement lib/cardEngine's math.
 *
 * A row whose speciesId is no longer in the roster (a species removed in a
 * later release) degrades to a readable "Unknown" card rather than throwing
 * and taking the whole collection page down with it.
 */
export function toCreatureCardDTO(card: CreatureCard): CreatureCardDTO {
  const species = getSpecies(card.speciesId);
  return {
    id: card.id,
    speciesId: card.speciesId,
    nameEn: species?.nameEn ?? "Unknown",
    nameKm: species?.nameKm ?? "មិនស្គាល់",
    element: species?.element ?? "SHADOW",
    shape: species?.shape ?? "spirit",
    emoji: species?.emoji ?? "❔",
    loreEn: species?.loreEn ?? "",
    loreKm: species?.loreKm ?? "",
    stars: card.stars,
    baseCp: card.baseCp,
    power: powerOf(card),
    level: card.level,
    exp: card.exp,
    expNeeded: expToNextLevel(card.level),
    isShiny: card.isShiny,
  };
}
