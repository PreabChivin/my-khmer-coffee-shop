import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

// 👑 Mark a redemption FULFILLED (reward handed over to the customer).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const updated = await prisma.redemptionHistory.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "FULFILLED" },
    });
    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Not found or already fulfilled." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "The database is busy." }, { status: 503 });
  }
}
