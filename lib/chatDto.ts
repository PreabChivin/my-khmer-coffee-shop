import type { ChatMessage, ChatReaction, GameSession, User } from "@prisma/client";
import { generationFromDOB } from "@/lib/generation";
import {
  CHAT_EMOJIS,
  type ChatGameSummary,
  type ChatMessageDTO,
  type ChatMessageKind,
  type ChatReactionSummary,
  type GameStatus,
  type GameType,
} from "@/lib/types";

type GameWithPlayers = GameSession & {
  player1: Pick<User, "id" | "name">;
  player2: Pick<User, "id" | "name"> | null;
  target?: Pick<User, "id" | "name"> | null;
};

type MessageWithRelations = ChatMessage & {
  user: Pick<User, "id" | "name" | "role" | "dateOfBirth" | "avatarUrl">;
  reactions: ChatReaction[];
  gameSession?: GameWithPlayers | null;
};

/** Prisma include shape shared by every route that returns member-facing chat
 *  messages, so game-invite bubbles always carry their live game summary. */
export const chatMessageInclude = {
  user: { select: { id: true, name: true, role: true, dateOfBirth: true, avatarUrl: true } },
  reactions: true,
  gameSession: {
    include: {
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
      target: { select: { id: true, name: true } },
    },
  },
} as const;

function toGameSummary(game: GameWithPlayers, viewerId: string): ChatGameSummary {
  const iAmParticipant = game.player1Id === viewerId || game.player2Id === viewerId;
  const isTargeted = game.targetUserId !== null;
  const canAccept =
    game.status === "PENDING" &&
    game.player1Id !== viewerId &&
    (!isTargeted || game.targetUserId === viewerId);

  return {
    id: game.id,
    gameType: game.gameType as GameType,
    status: game.status as GameStatus,
    player1: { id: game.player1.id, name: game.player1.name },
    player2: game.player2 ? { id: game.player2.id, name: game.player2.name } : null,
    winnerId: game.winnerId,
    isTie: game.isTie,
    iAmParticipant,
    targetName: game.target?.name ?? null,
    canAccept,
  };
}

/** Maps a Prisma ChatMessage (+ author + reactions + optional game) to the
 *  wire DTO, folding the flat ChatReaction rows into one summary per emoji so
 *  the client never has to do that aggregation itself. */
export function toChatMessageDTO(
  message: MessageWithRelations,
  viewerId: string
): ChatMessageDTO {
  const summaries: ChatReactionSummary[] = CHAT_EMOJIS.map((emoji) => {
    const forEmoji = message.reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: forEmoji.length,
      reactedByMe: forEmoji.some((r) => r.userId === viewerId),
    };
  }).filter((summary) => summary.count > 0);

  return {
    id: message.id,
    text: message.text,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt.toISOString(),
    author: {
      id: message.user.id,
      name: message.user.name,
      role: message.user.role,
      generationEmoji: generationFromDOB(message.user.dateOfBirth)?.emoji ?? "☕",
      avatarUrl: message.user.avatarUrl,
    },
    isMine: message.userId === viewerId,
    reactions: summaries,
    kind: message.kind as ChatMessageKind,
    game: message.gameSession ? toGameSummary(message.gameSession, viewerId) : null,
    isEdited: message.editedAt !== null,
  };
}
