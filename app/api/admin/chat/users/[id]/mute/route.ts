import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

const MIN_MINUTES = 1;
const MAX_MINUTES = 10080; // 1 week

/**
 * POST /api/admin/chat/users/[id]/mute
 * Body: { minutes: number } — ADMIN only, mirrors the account
 * deactivate/reactivate gating (STAFF can view the monitor but not mute/ban).
 * Blocks sending/reacting only; the member can still read the room.
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

  let body: { minutes?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const minutes = Number(body.minutes);
  if (!Number.isFinite(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
    return NextResponse.json(
      { error: `រយៈពេលត្រូវតែចាប់ពី ${MIN_MINUTES} ទៅ ${MAX_MINUTES} នាទី។` },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញគណនីនេះទេ។" }, { status: 404 });
    }

    const chatMutedUntil = new Date(Date.now() + minutes * 60_000);
    const updated = await prisma.user.update({
      where: { id },
      data: { chatMutedUntil },
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
