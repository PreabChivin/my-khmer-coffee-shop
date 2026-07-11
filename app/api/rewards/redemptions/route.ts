import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { RedemptionDTO } from "@/lib/types";

// 🧾 The logged-in customer's own redemption history.
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  try {
    const rows = await prisma.redemptionHistory.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    const body: RedemptionDTO[] = rows.map((r) => ({
      id: r.id,
      rewardName: r.rewardName,
      rewardEmoji: r.rewardEmoji,
      cost: r.cost,
      status: r.status as "PENDING" | "FULFILLED",
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "The database is busy." }, { status: 503 });
  }
}
