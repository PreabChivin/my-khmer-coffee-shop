import { prisma } from "@/lib/prisma";

export type ConversationAccess =
  | { ok: true }
  | { ok: false; status: 404 | 403; error: string };

/**
 * 🔒 The real-time isolation boundary for private messaging. Every route that
 * reads or writes a DirectConversation's messages calls this FIRST — it's the
 * single place that decides "is this caller allowed to see this thread at
 * all," so the isolation guarantee can't drift between routes. There is no
 * pub/sub channel to secure here (this app's "real-time" is short-interval
 * polling, same as the shared Café Lounge — no Pusher/WebSocket infra, a
 * deliberate choice made earlier in this project), so isolation is enforced
 * per-request: a 404 (not a 403) for a real conversation the caller isn't
 * part of, so its existence isn't leaked to an uninvolved member either.
 */
export async function assertConversationParticipant(
  conversationId: string,
  userId: string
): Promise<ConversationAccess> {
  const conversation = await prisma.directConversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conversation) {
    return { ok: false, status: 404, error: "រកមិនឃើញការជជែកនេះទេ។" };
  }
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    // Same 404 as "doesn't exist" — an uninvolved member gets no signal
    // that a conversation between two other people exists at this id.
    return { ok: false, status: 404, error: "រកមិនឃើញការជជែកនេះទេ។" };
  }
  return { ok: true };
}
