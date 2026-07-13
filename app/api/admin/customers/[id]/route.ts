import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { toOrderHistoryItem } from "@/lib/orderHistory";
import { toUserDTO } from "@/lib/userDto";
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

    const [orders, savedAddresses] = await Promise.all([
      prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        include: {
          payment: true,
          items: { include: { product: true } },
        },
      }),
      prisma.savedAddress.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Lifetime value = sum of totals for orders that were actually paid.
    const lifetimeValue = orders
      .filter((o) => o.payment?.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const body: CustomerProfileDTO = {
      user: toUserDTO(user),
      lifetimeValue: Math.round(lifetimeValue * 100) / 100,
      orderCount: orders.length,
      orders: orders.map(toOrderHistoryItem),
      savedAddresses: savedAddresses.map((a) => ({
        id: a.id,
        label: a.label,
        address: a.address,
        latitude: a.latitude,
        longitude: a.longitude,
      })),
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
