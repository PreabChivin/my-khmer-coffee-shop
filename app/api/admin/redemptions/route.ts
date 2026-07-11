import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import type { AdminRedemptionDTO } from "@/lib/types";

// 👑 Redemptions awaiting fulfilment (and recently fulfilled), for staff.
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await prisma.redemptionHistory.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      include: { user: { select: { name: true, email: true } } },
    });
    const body: AdminRedemptionDTO[] = rows.map((r) => ({
      id: r.id,
      rewardName: r.rewardName,
      rewardEmoji: r.rewardEmoji,
      cost: r.cost,
      status: r.status as "PENDING" | "FULFILLED",
      createdAt: r.createdAt.toISOString(),
      userId: r.userId,
      customerName: r.user.name,
      customerEmail: r.user.email,
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "The database is busy." }, { status: 503 });
  }
}
