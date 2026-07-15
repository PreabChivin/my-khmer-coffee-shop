import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStaffGroupAlert, sendStaffGroupPhoto } from "@/lib/telegram";

// Matches the Node/Next.js serverless request body ceiling — reject bigger
// uploads client-side too, but never trust that alone.
const MAX_PHOTO_BYTES = 4.5 * 1024 * 1024;

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
    return NextResponse.json({ error: "រកមិនឃើញការកម្ម៉ង់នេះទេ។" }, { status: 404 });
  }

  if (order.orderStatus === "CANCELLED") {
    return NextResponse.json(
      { error: "ការកម្ម៉ង់នេះត្រូវបានលុបចោលហើយ។" },
      { status: 400 }
    );
  }

  // 📸 Optional payment-proof screenshot — never persisted to our own
  // storage, only relayed straight through to the staff group. A missing or
  // malformed body is treated as simply "no photo attached".
  let photo: File | null = null;
  try {
    const formData = await request.formData();
    const candidate = formData.get("photo");
    if (candidate instanceof File && candidate.size > 0) {
      if (candidate.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "រូបថតអេក្រង់ធំពេក (អតិបរមា 4.5MB)។" },
          { status: 400 }
        );
      }
      photo = candidate;
    }
  } catch {
    // no body / not multipart — proceed as if no photo was attached
  }

  if (order.orderStatus === "PENDING") {
    await prisma.order.update({
      where: { id },
      data: { orderStatus: "AWAITING_VERIFICATION" },
    });

    // 📣 Staff group ping — never the customer's private chat. Best-effort:
    // a Telegram outage must never fail the customer's "I've paid" action.
    const shortId = id.slice(0, 8).toUpperCase();
    try {
      await sendStaffGroupAlert(
        `🚨 <b>ត្រូវការផ្ទៀងផ្ទាត់ការទូទាត់</b>\nការកម្ម៉ង់ #${shortId} — ${order.customerName} (${order.customerPhone}) ថាបានបង់ប្រាក់ $${order.totalAmount.toFixed(2)} ហើយ។ សូមឆែកកម្មវិធីធនាគាររបស់អ្នក! 👀`
      );
    } catch (err) {
      console.error("[telegram] Failed to send staff group alert:", err);
    }

    if (photo) {
      try {
        await sendStaffGroupPhoto(
          photo,
          photo.name || "payment-proof.jpg",
          `📸 វិក្កយបត្របង់ប្រាក់ — ការកម្ម៉ង់ #${shortId}`
        );
      } catch (err) {
        console.error("[telegram] Failed to forward payment-proof photo:", err);
      }
    }
  }

  return NextResponse.json({ success: true, orderId: id });
}
