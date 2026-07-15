import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

// 👑 Mark a redemption FULFILLED (reward handed over to the customer).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const updated = await prisma.redemptionHistory.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "FULFILLED" },
    });
    if (updated.count === 0) {
      return NextResponse.json(
        { error: "រកមិនឃើញ ឬបានប្រគល់ជូនរួចហើយ។" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}
