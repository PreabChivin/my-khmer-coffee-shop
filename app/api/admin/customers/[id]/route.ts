import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { toOrderHistoryItem } from "@/lib/orderHistory";
import type { CustomerProfileDTO } from "@/lib/types";

// 👑 Admin-only per-customer profile: account details, lifetime value (sum of
// PAID order totals), order count, and full purchase history.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        items: { include: { product: true } },
      },
    });

    // Lifetime value = sum of totals for orders that were actually paid.
    const lifetimeValue = orders
      .filter((o) => o.payment?.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const body: CustomerProfileDTO = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        loyaltyPoints: user.loyaltyPoints,
      },
      lifetimeValue: Math.round(lifetimeValue * 100) / 100,
      orderCount: orders.length,
      orders: orders.map(toOrderHistoryItem),
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
