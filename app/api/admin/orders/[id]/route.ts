import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { normalizePhone } from "@/lib/loyalty";
import { pointsForAmount } from "@/lib/loyaltyPoints";
import { buildCustomerStatusMessage, sendCustomerAlert } from "@/lib/telegram";
import type { OrderStatus, OrderType } from "@/lib/types";

const NOTIFIABLE_STATUSES: OrderStatus[] = [
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

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

    // 💎 Loyalty points: credited exactly once, the first time an order is
    // marked COMPLETED, and only when it belongs to a registered account. The
    // pointsAwarded flag makes it idempotent — re-completing never double-awards.
    const shouldAwardPoints =
      body.orderStatus === "COMPLETED" &&
      existing.orderStatus !== "COMPLETED" &&
      existing.userId !== null &&
      !existing.pointsAwarded;

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

      if (shouldAwardPoints) {
        const points = pointsForAmount(existing.totalAmount);
        if (points > 0 && existing.userId) {
          await tx.user.update({
            where: { id: existing.userId },
            data: { loyaltyPoints: { increment: points } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          orderStatus: body.orderStatus ?? undefined,
          giftRedeemed: body.giftRedeemed ?? undefined,
          // Flip the guard in the same transaction as the credit above.
          pointsAwarded: shouldAwardPoints ? true : undefined,
        },
        include: { items: { include: { product: true } }, payment: true },
      });
    });

    // 🔔 Best-effort Telegram DM — only when the status actually changed to
    // one customers care about, and only if they've linked a chat via the
    // deep-link button. Awaited (not fire-and-forget) since a serverless
    // function can be frozen the instant the response is sent; wrapped so a
    // Telegram outage can never fail an already-successful status update.
    const statusChanged =
      body.orderStatus !== undefined && body.orderStatus !== existing.orderStatus;
    if (
      statusChanged &&
      order.customerTelegramChatId &&
      NOTIFIABLE_STATUSES.includes(order.orderStatus as OrderStatus)
    ) {
      try {
        const message = buildCustomerStatusMessage(
          order.orderStatus as Extract<
            OrderStatus,
            "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
          >,
          order.orderType as OrderType,
          order.id.slice(0, 8).toUpperCase()
        );
        await sendCustomerAlert(order.customerTelegramChatId, message);
      } catch (err) {
        console.error("[telegram] Failed to send customer status alert:", err);
      }
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
