import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const VALID_STATUSES = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { orderStatus?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.orderStatus || !VALID_STATUSES.includes(body.orderStatus)) {
    return NextResponse.json(
      { error: `orderStatus must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Approving an order (transitioning it into the kitchen queue) is the
  // staff's manual confirmation that they cross-checked their banking app —
  // record that as the payment being verified.
  const isApproval =
    body.orderStatus === "PREPARING" && existing.orderStatus !== "PREPARING";

  const order = await prisma.$transaction(async (tx) => {
    if (isApproval) {
      await tx.payment.updateMany({
        where: { orderId: id },
        data: { paymentStatus: "PAID", paidAt: new Date() },
      });
    }

    return tx.order.update({
      where: { id },
      data: { orderStatus: body.orderStatus },
      include: { items: { include: { product: true } }, payment: true },
    });
  });

  return NextResponse.json(order);
}
