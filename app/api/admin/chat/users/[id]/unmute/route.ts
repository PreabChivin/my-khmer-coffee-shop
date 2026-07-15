import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

/** POST /api/admin/chat/users/[id]/unmute — ADMIN only. */
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
      data: { chatMutedUntil: null },
      select: { id: true, chatMutedUntil: true },
    });
    return NextResponse.json({ id: updated.id, chatMutedUntil: updated.chatMutedUntil });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
