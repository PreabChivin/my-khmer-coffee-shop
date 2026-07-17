import type { DirectConversation, DirectMessage, User } from "@prisma/client";
import { generationFromDOB } from "@/lib/generation";
import type {
  DirectConversationPeerDTO,
  DirectConversationSummaryDTO,
  DirectMessageDTO,
  DirectMessageKind,
} from "@/lib/types";

type PeerUser = Pick<User, "id" | "name" | "role" | "dateOfBirth" | "avatarUrl">;

export function toDirectPeerDTO(user: PeerUser): DirectConversationPeerDTO {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    generationEmoji: generationFromDOB(user.dateOfBirth)?.emoji ?? "☕",
    avatarUrl: user.avatarUrl,
  };
}

export function toDirectMessageDTO(message: DirectMessage, viewerId: string): DirectMessageDTO {
  return {
    id: message.id,
    conversationId: message.conversationId,
    text: message.text,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt.toISOString(),
    isMine: message.senderId === viewerId,
    kind: message.kind as DirectMessageKind,
    isEdited: message.editedAt !== null,
  };
}

type ConversationWithPeerAndLastMessage = DirectConversation & {
  userA: PeerUser;
  userB: PeerUser;
  messages: DirectMessage[]; // expected: already queried with take:1, orderBy createdAt desc
};

/** Resolves "the other person" for the viewer, regardless of whether they're
 *  stored as userA or userB (see the userAId < userBId note on the schema —
 *  callers never need to know which slot they landed in). */
export function toDirectConversationSummaryDTO(
  conversation: ConversationWithPeerAndLastMessage,
  viewerId: string
): DirectConversationSummaryDTO {
  const peerUser = conversation.userAId === viewerId ? conversation.userB : conversation.userA;
  const last = conversation.messages[0] ?? null;

  return {
    id: conversation.id,
    peer: toDirectPeerDTO(peerUser),
    lastMessage: last
      ? {
          text: last.deletedAt ? "" : last.text,
          kind: last.kind as DirectMessageKind,
          createdAt: last.createdAt.toISOString(),
          isMine: last.senderId === viewerId,
        }
      : null,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}
