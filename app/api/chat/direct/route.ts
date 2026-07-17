import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toDirectConversationSummaryDTO } from "@/lib/directChatDto";
import type { DirectConversationSummaryDTO } from "@/lib/types";

/** Shared include for a conversation + both participants' public fields +
 *  only the single most recent message (for list previews). */
const conversationInclude = {
  userA: { select: { id: true, name: true, role: true, dateOfBirth: true, avatarUrl: true } },
  userB: { select: { id: true, name: true, role: true, dateOfBirth: true, avatarUrl: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const;

/**
 * GET /api/chat/direct
 * "Active Private Chats" list — every conversation the caller participates
 * in, most-recently-active first (DirectConversation.updatedAt is bumped on
 * every send), each with a one-line preview of the last message.
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const rows = await prisma.directConversation.findMany({
      where: { OR: [{ userAId: session.id }, { userBId: session.id }] },
      include: conversationInclude,
      orderBy: { updatedAt: "desc" },
    });
    const conversations: DirectConversationSummaryDTO[] = rows.map((row) =>
      toDirectConversationSummaryDTO(row, session.id)
    );
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}

/**
 * POST /api/chat/direct
 * Body: { targetUserId: string }
 * "Send Private Message" entry point — finds the existing 1-on-1 thread with
 * that member, or creates it. userAId/userBId are always stored as the
 * lexicographically SMALLER/LARGER of the two ids (never trusting which side
 * the client initiated from), so "the conversation between X and Y" is one
 * unique-indexed upsert with no race between two people opening a thread
 * with each other at the same moment — the DB's @@unique constraint is the
 * actual source of truth, this is just how we address it correctly.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { targetUserId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const targetUserId = typeof body.targetUserId === "string" ? body.targetUserId : "";
  if (!targetUserId) {
    return NextResponse.json({ error: "សូមជ្រើសរើសសមាជិកម្នាក់។" }, { status: 400 });
  }
  if (targetUserId === session.id) {
    return NextResponse.json(
      { error: "អ្នកមិនអាចផ្ញើសារឯកជនទៅខ្លួនឯងបានទេ។" },
      { status: 400 }
    );
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, deactivatedAt: true },
    });
    if (!target || target.deactivatedAt) {
      return NextResponse.json({ error: "រកមិនឃើញសមាជិកនេះទេ។" }, { status: 404 });
    }

    const [userAId, userBId] =
      session.id < targetUserId ? [session.id, targetUserId] : [targetUserId, session.id];

    const conversation = await prisma.directConversation.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId },
      update: {}, // already exists — no-op, just return it
      include: conversationInclude,
    });

    const dto = toDirectConversationSummaryDTO(conversation, session.id);
    return NextResponse.json(dto, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចបើកការជជែកឯកជនបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
