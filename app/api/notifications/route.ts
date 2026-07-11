import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { NotificationDTO } from "@/lib/types";

// 🔔 The signed-in customer's notifications: everything targeted to them PLUS
// every broadcast (userId = null). Newest first. The client bell derives
// "unread" from these vs. its last-seen marker.
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    // Guests still see broadcasts (public announcements).
    try {
      const rows = await prisma.notification.findMany({
        where: { userId: null },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return NextResponse.json(rows.map(toDTO));
    } catch {
      return NextResponse.json([]);
    }
  }

  try {
    const rows = await prisma.notification.findMany({
      where: { OR: [{ userId: session.id }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(rows.map(toDTO));
  } catch {
    return NextResponse.json([]);
  }
}

function toDTO(n: {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  href: string | null;
  emoji: string;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    emoji: n.emoji,
    createdAt: n.createdAt.toISOString(),
    isBroadcast: n.userId === null,
  };
}
