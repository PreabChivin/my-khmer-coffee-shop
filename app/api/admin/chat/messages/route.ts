import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import type { AdminChatMessageDTO } from "@/lib/types";

const PAGE_SIZE = 50;

/**
 * GET /api/admin/chat/messages?flaggedOnly=true&before=<messageId>
 * Staff/Admin monitoring feed — unlike the member-facing GET /api/chat/messages,
 * this INCLUDES soft-deleted messages (full audit trail) and never filters by
 * `deletedAt`. Newest-first, cursor-paginated backwards via `before` so the
 * monitor can page through history without re-fetching everything each time.
 */
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  const flaggedOnly = request.nextUrl.searchParams.get("flaggedOnly") === "true";
  const beforeId = request.nextUrl.searchParams.get("before");

  try {
    let beforeCreatedAt: Date | undefined;
    if (beforeId) {
      const cursor = await prisma.chatMessage.findUnique({
        where: { id: beforeId },
        select: { createdAt: true },
      });
      beforeCreatedAt = cursor?.createdAt;
    }

    const rows = await prisma.chatMessage.findMany({
      where: {
        ...(flaggedOnly ? { flagged: true } : {}),
        ...(beforeCreatedAt ? { createdAt: { lt: beforeCreatedAt } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            chatMutedUntil: true,
            chatBannedAt: true,
            avatarUrl: true,
          },
        },
        _count: { select: { reactions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    });

    const messages: AdminChatMessageDTO[] = rows.map((row) => ({
      id: row.id,
      text: row.text,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt.toISOString(),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
      flagged: row.flagged,
      reactionCount: row._count.reactions,
      author: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        role: row.user.role,
        chatMutedUntil: row.user.chatMutedUntil ? row.user.chatMutedUntil.toISOString() : null,
        chatBannedAt: row.user.chatBannedAt ? row.user.chatBannedAt.toISOString() : null,
        avatarUrl: row.user.avatarUrl,
      },
    }));

    return NextResponse.json({
      messages,
      nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1].id : null,
    });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
