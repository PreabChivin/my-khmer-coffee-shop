import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

/**
 * POST /api/admin/chat/messages/[id]/flag
 * Toggles the flag — same Staff/Admin gate as message deletion (message-level
 * moderation is already STAFF+ADMIN via DELETE /api/chat/messages/[id]).
 * Flagging keeps the message intact as evidence, unlike deleting it.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const message = await prisma.chatMessage.findUnique({
      where: { id },
      select: { flagged: true },
    });
    if (!message) {
      return NextResponse.json({ error: "រកមិនឃើញសារនេះទេ។" }, { status: 404 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { flagged: !message.flagged },
      select: { flagged: true },
    });
    return NextResponse.json({ flagged: updated.flagged });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចធ្វើសកម្មភាពនេះបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
