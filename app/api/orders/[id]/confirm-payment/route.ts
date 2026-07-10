import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStaffGroupAlert } from "@/lib/telegram";

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

    // 📣 Staff group ping — never the customer's private chat. Best-effort:
    // a Telegram outage must never fail the customer's "I've paid" action.
    try {
      const shortId = id.slice(0, 8).toUpperCase();
      await sendStaffGroupAlert(
        `🚨 <b>ត្រូវការផ្ទៀងផ្ទាត់ការទូទាត់</b>\nការកម្ម៉ង់ #${shortId} — ${order.customerName} (${order.customerPhone}) ថាបានបង់ប្រាក់ $${order.totalAmount.toFixed(2)} ហើយ។ សូមឆែកកម្មវិធីធនាគាររបស់អ្នក! 👀`
      );
    } catch (err) {
      console.error("[telegram] Failed to send staff group alert:", err);
    }
  }

  return NextResponse.json({ success: true, orderId: id });
}
