import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { normalizePhone } from "@/lib/loyalty";

const VALID_STATUSES = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "PREPARING",
  "READY",
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

  let body: { orderStatus?: string; giftRedeemed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.orderStatus === undefined && body.giftRedeemed === undefined) {
    return NextResponse.json(
      { error: "Provide orderStatus and/or giftRedeemed" },
      { status: 400 }
    );
  }

  if (body.orderStatus !== undefined && !VALID_STATUSES.includes(body.orderStatus)) {
    return NextResponse.json(
      { error: `orderStatus must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Approving an order (transitioning it into the kitchen queue) is the
    // staff's manual confirmation that they cross-checked their banking app —
    // record that as the payment being verified, and award a 🐻 loyalty stamp.
    const isApproval =
      body.orderStatus === "PREPARING" && existing.orderStatus !== "PREPARING";

    const order = await prisma.$transaction(async (tx) => {
      if (isApproval) {
        await tx.payment.updateMany({
          where: { orderId: id },
          data: { paymentStatus: "PAID", paidAt: new Date() },
        });

        const phone = normalizePhone(existing.customerPhone);
        if (phone.length >= 6) {
          await tx.loyaltyAccount.upsert({
            where: { phone },
            create: { phone, stampCount: 1 },
            update: { stampCount: { increment: 1 } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          orderStatus: body.orderStatus ?? undefined,
          giftRedeemed: body.giftRedeemed ?? undefined,
        },
        include: { items: { include: { product: true } }, payment: true },
      });
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
