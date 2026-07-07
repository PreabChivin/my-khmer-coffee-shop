import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Customer-facing action: fired when the shopper clicks "I Have Paid" after
// transferring funds to the shop's static KHQR. This does NOT mark the
// payment as verified — it only flags the order for staff to manually
// cross-check against their banking app before approving it in the kitchen
// dashboard.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.orderStatus === "CANCELLED") {
    return NextResponse.json(
      { error: "This order has been cancelled" },
      { status: 400 }
    );
  }

  if (order.orderStatus === "PENDING") {
    await prisma.order.update({
      where: { id },
      data: { orderStatus: "AWAITING_VERIFICATION" },
    });
  }

  return NextResponse.json({ success: true, orderId: id });
}
