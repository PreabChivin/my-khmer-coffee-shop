import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toOrderHistoryItem } from "@/lib/orderHistory";
import type { OrderHistoryItemDTO } from "@/lib/types";

// 🧾 The logged-in customer's own order history. Scoped strictly to their
// session's userId — a customer can only ever see their own orders.
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        items: { include: { product: true } },
      },
    });
    const body: OrderHistoryItemDTO[] = orders.map(toOrderHistoryItem);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
