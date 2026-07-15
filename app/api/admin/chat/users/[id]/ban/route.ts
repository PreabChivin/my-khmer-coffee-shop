import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

/**
 * POST /api/admin/chat/users/[id]/ban — ADMIN only. Permanent (until
 * explicitly unbanned) — blocks the member from the chat feature entirely
 * (read and write), unlike a mute which only blocks writing. Does not touch
 * User.deactivatedAt — a chat ban never affects login, ordering, or checkout.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireAdminRole(request);
  if (!session) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញគណនីនេះទេ។" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { chatBannedAt: new Date() },
      select: { id: true, chatBannedAt: true },
    });
    return NextResponse.json({ id: updated.id, chatBannedAt: updated.chatBannedAt });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
