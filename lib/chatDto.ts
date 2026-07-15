import type { ChatMessage, ChatReaction, User } from "@prisma/client";
import { generationFromDOB } from "@/lib/generation";
import { CHAT_EMOJIS, type ChatMessageDTO, type ChatReactionSummary } from "@/lib/types";

type MessageWithRelations = ChatMessage & {
  user: Pick<User, "id" | "name" | "role" | "dateOfBirth">;
  reactions: ChatReaction[];
};

/** Maps a Prisma ChatMessage (+ author + reactions) to the wire DTO, folding
 *  the flat ChatReaction rows into one summary per emoji so the client never
 *  has to do that aggregation itself. */
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
    },
    isMine: message.userId === viewerId,
    reactions: summaries,
  };
}
