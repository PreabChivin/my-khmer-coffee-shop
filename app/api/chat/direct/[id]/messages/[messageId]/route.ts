import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { assertConversationParticipant } from "@/lib/directChatAccess";
import { toDirectMessageDTO } from "@/lib/directChatDto";

const MAX_TEXT_LENGTH = 500;

/**
 * DELETE /api/chat/direct/[id]/messages/[messageId]
 * Soft-delete only — mirrors the shared room's isDeletedByUser audit
 * retention exactly. UNLIKE the shared room, there is no staff/admin
 * moderation override: this is a private thread between two members, so the
 * only person who can remove a message is whoever sent it. isDeletedByUser
 * is always true here for that same reason (there is no other actor who
 * could have deleted it).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const { id: conversationId, messageId } = await params;
  const access = await assertConversationParticipant(conversationId, session.id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: { conversationId: true, senderId: true, deletedAt: true },
    });
    if (!message || message.conversationId !== conversationId || message.deletedAt) {
      return NextResponse.json({ error: "រកមិនឃើញសារនេះទេ។" }, { status: 404 });
    }
    if (message.senderId !== session.id) {
      return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិលុបសារនេះទេ។" }, { status: 403 });
    }

    await prisma.directMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), isDeletedByUser: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចលុបសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}

/**
 * PATCH /api/chat/direct/[id]/messages/[messageId]
 * Body: { text: string } — sender-only, same originalText-stamped-once
 * audit pattern as the shared room.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id: conversationId, messageId } = await params;
  const access = await assertConversationParticipant(conversationId, session.id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "សារមិនអាចទទេបានទេ។" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `សារវែងពេក (អតិបរមា ${MAX_TEXT_LENGTH} តួអក្សរ)។` },
      { status: 400 }
    );
  }

  try {
    const message = await prisma.directMessage.findUnique({
      where: { id: messageId },
      select: {
        conversationId: true,
        senderId: true,
        deletedAt: true,
        text: true,
        originalText: true,
        kind: true,
      },
    });
    if (!message || message.conversationId !== conversationId || message.deletedAt) {
      return NextResponse.json({ error: "រកមិនឃើញសារនេះទេ។" }, { status: 404 });
    }
    if (message.senderId !== session.id) {
      return NextResponse.json({ error: "អ្នកមិនអាចកែសារនេះបានទេ។" }, { status: 403 });
    }
    if (message.kind !== "TEXT") {
      return NextResponse.json({ error: "មិនអាចកែសារប្រភេទនេះបានទេ។" }, { status: 400 });
    }

    const updated = await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        text,
        editedAt: new Date(),
        originalText: message.originalText ?? message.text,
      },
    });
    return NextResponse.json(toDirectMessageDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចកែសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
