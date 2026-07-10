import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import type { AdminCustomerRowDTO } from "@/lib/types";

// 👑 Admin-only: every registered customer with their order count, for the
// "Registered Customers" dashboard table. Generation is derived client-side
// from dateOfBirth (lib/generation.ts).
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });

    const body: AdminCustomerRowDTO[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.toISOString() : null,
      loyaltyPoints: u.loyaltyPoints,
      joinedAt: u.createdAt.toISOString(),
      orderCount: u._count.orders,
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
