import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { toChatMessageDTO, chatMessageInclude } from "@/lib/chatDto";

const MAX_TEXT_LENGTH = 500;

/**
 * DELETE /api/chat/messages/[id]
 * Soft-delete (mirrors User.deactivatedAt) — the sender can remove their own
 * message; STAFF/ADMIN can remove anyone's, for basic moderation of the
 * shared public room. isDeletedByUser records WHICH of those happened, so
 * the Admin Chat Monitor's audit trail can tell a self-delete apart from a
 * moderation action.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id },
      select: { userId: true, deletedAt: true },
    });
    if (!message || message.deletedAt) {
      return NextResponse.json({ error: "រកមិនឃើញសារនេះទេ។" }, { status: 404 });
    }

    const isOwner = message.userId === session.id;
    const isModerator = session.role === "STAFF" || session.role === "ADMIN";
    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: "អ្នកមិនមានសិទ្ធិលុបសារនេះទេ។" },
        { status: 403 }
      );
    }

    await prisma.chatMessage.update({
      where: { id },
      data: { deletedAt: new Date(), isDeletedByUser: isOwner },
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
 * PATCH /api/chat/messages/[id]
 * Body: { text: string } — sender-only; STAFF/ADMIN cannot edit someone
 * else's words (they can only delete/flag). originalText is set once, on the
 * FIRST edit, so it always holds the message exactly as first sent for the
 * Admin Chat Monitor's audit view — a second edit only updates `text`.
 */
export async function PATCH(
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

  const { id } = await params;

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
    const message = await prisma.chatMessage.findUnique({
      where: { id },
      select: { userId: true, deletedAt: true, text: true, originalText: true, kind: true },
    });
    if (!message || message.deletedAt) {
      return NextResponse.json({ error: "រកមិនឃើញសារនេះទេ។" }, { status: 404 });
    }
    if (message.userId !== session.id) {
      return NextResponse.json({ error: "អ្នកមិនអាចកែសារនេះបានទេ។" }, { status: 403 });
    }
    if (message.kind !== "TEXT") {
      return NextResponse.json({ error: "មិនអាចកែសារប្រភេទនេះបានទេ។" }, { status: 400 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: {
        text,
        editedAt: new Date(),
        // Only stamp the true original on the FIRST edit.
        originalText: message.originalText ?? message.text,
      },
      include: chatMessageInclude,
    });
    return NextResponse.json(toChatMessageDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចកែសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
