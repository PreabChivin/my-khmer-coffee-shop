import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toChatMessageDTO, chatMessageInclude } from "@/lib/chatDto";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { CHAT_EMOJIS, type ChatEmoji } from "@/lib/types";

const messageInclude = chatMessageInclude;

/**
 * POST /api/chat/messages/[id]/react
 * Body: { emoji: "❤️" | "🔥" | "💀" | "💯" | "😭" }
 * Toggle: reacting with an emoji you've already used on this message removes
 * it instead — matches the double-tap-to-react / tap-again-to-undo pattern.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id: messageId } = await params;

  let body: { emoji?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  const emoji = body.emoji as ChatEmoji;
  if (!CHAT_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "សញ្ញាអារម្មណ៍មិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, deletedAt: true },
    });
    if (!message || message.deletedAt) {
      return NextResponse.json({ error: "រកមិនឃើញសារនេះទេ។" }, { status: 404 });
    }

    const existing = await prisma.chatReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId: session.id, emoji } },
    });
    if (existing) {
      await prisma.chatReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.chatReaction.create({ data: { messageId, userId: session.id, emoji } });
    }

    const updated = await prisma.chatMessage.findUniqueOrThrow({
      where: { id: messageId },
      include: messageInclude,
    });
    return NextResponse.json(toChatMessageDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចធ្វើសកម្មភាពនេះបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
