import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import type { AdminCustomerRowDTO } from "@/lib/types";

// 👑 Admin-only: every registered customer with their order count, for the
// "Registered Customers" dashboard table. Generation is derived client-side
// from dateOfBirth (lib/generation.ts).
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
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
      username: u.username,
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.toISOString() : null,
      loyaltyPoints: u.loyaltyPoints,
      joinedAt: u.createdAt.toISOString(),
      orderCount: u._count.orders,
      role: u.role,
      deactivatedAt: u.deactivatedAt ? u.deactivatedAt.toISOString() : null,
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
