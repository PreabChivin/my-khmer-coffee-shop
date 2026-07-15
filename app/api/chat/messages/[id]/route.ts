import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";

/**
 * DELETE /api/chat/messages/[id]
 * Soft-delete (mirrors User.deactivatedAt) — the sender can remove their own
 * message; STAFF/ADMIN can remove anyone's, for basic moderation of the
 * shared public room.
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

    await prisma.chatMessage.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចលុបសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
