import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: true } },
        payment: true,
        // 👤 Linked customer account (null for guest orders) so the dashboard
        // can offer a click-through to their lifetime history + LTV.
        user: { select: { id: true, name: true, loyaltyPoints: true } },
      },
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
