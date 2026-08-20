import type { BattleMatch, BattlePlayer, User } from "@prisma/client";
import { getSpecies } from "@/lib/creatures";
import type { BattleRosterCard } from "@/lib/battleEngine";
import type {
  BattleActionDTO,
  BattleMatchDetailDTO,
  BattlePlayerStateDTO,
  BattleRosterCardDTO,
} from "@/lib/types";

type MatchWithPlayers = BattleMatch & {
  players: (BattlePlayer & { user: Pick<User, "id" | "name"> })[];
};

export const battleMatchInclude = {
  players: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
} as const;

function toRosterCardDTO(card: BattleRosterCard): BattleRosterCardDTO {
  const species = getSpecies(card.speciesId);
  return {
    cardId: card.cardId,
    speciesId: card.speciesId,
    nameEn: species?.nameEn ?? "Unknown",
    nameKm: species?.nameKm ?? "មិនស្គាល់",
    element: card.element,
    shape: species?.shape ?? "spirit",
    emoji: species?.emoji ?? "❔",
    stars: card.stars,
    power: card.power,
    maxHp: card.maxHp,
    hp: card.hp,
    fainted: card.fainted,
  };
}

export function toBattleMatchDetailDTO(
  match: MatchWithPlayers,
  viewerId: string
): BattleMatchDetailDTO {
  const mine = match.players.find((p) => p.userId === viewerId);
  const opponent = match.players.find((p) => p.userId !== viewerId);
  const ordered = [mine, opponent].filter((p): p is (typeof match.players)[number] => Boolean(p));

  const players: BattlePlayerStateDTO[] = ordered.map((p) => ({
    userId: p.userId,
    name: p.user.name,
    roster: (p.roster as unknown as BattleRosterCard[]).map(toRosterCardDTO),
    activeIndex: p.activeIndex,
  }));

  return {
    id: match.id,
    status: match.status as BattleMatchDetailDTO["status"],
    myUserId: viewerId,
    players,
    turnUserId: match.turnUserId,
    isMyTurn: match.turnUserId === viewerId,
    winnerUserId: match.winnerUserId,
    lastAction: (match.lastAction as BattleActionDTO | null) ?? null,
  };
}
