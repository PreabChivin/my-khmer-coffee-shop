import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { resolveUserTelegramChatId, sendCustomerAlert } from "@/lib/telegram";
import type { PointsAdjustmentDTO } from "@/lib/types";

const schema = z.object({
  // Positive = grant, negative = deduction/correction. Zero is meaningless.
  amount: z.number().int().refine((v) => v !== 0 && Math.abs(v) <= 1_000_000, {
    message: "ចំនួនពិន្ទុមិនត្រឹមត្រូវទេ។",
  }),
  reason: z.string().trim().min(1, "សូមផ្តល់មូលហេតុ។").max(200),
});

const INSUFFICIENT = "INSUFFICIENT_BALANCE";

/**
 * POST /api/admin/customers/[id]/points — Body: { amount, reason }
 * A manual Cafe Points correction, distinct from the badge/thank-you
 * "gift" flow (app/api/admin/customers/[id]/gift/route.ts, unchanged).
 * `amount` may be negative; a deduction is guarded by the same atomic
 * `updateMany WHERE loyaltyPoints >= abs(amount)` pattern used everywhere
 * else in this app that spends points (lib/redeemReward.ts,
 * lib/shopPurchase.ts), so a balance can never go negative. Every
 * adjustment — grant or deduction — is logged to PointsAdjustment for the
 * audit trail the admin panel reads back via GET below.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ទិន្នន័យមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }
  const { amount, reason } = parsed.data;

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "រកមិនឃើញអតិថិជននេះទេ។" }, { status: 404 });
    }

    type TxResult = { ok: false; error: string } | { ok: true; balanceAfter: number };

    const result = await prisma.$transaction(async (tx): Promise<TxResult> => {
      if (amount < 0) {
        const claim = await tx.user.updateMany({
          where: { id, loyaltyPoints: { gte: -amount } },
          data: { loyaltyPoints: { decrement: -amount } },
        });
        if (claim.count === 0) {
          return { ok: false, error: INSUFFICIENT };
        }
      } else {
        await tx.user.update({ where: { id }, data: { loyaltyPoints: { increment: amount } } });
      }

      const updated = await tx.user.findUniqueOrThrow({ where: { id } });
      await tx.pointsAdjustment.create({
        data: {
          userId: id,
          amount,
          reason,
          balanceAfter: updated.loyaltyPoints,
          adminId: admin.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: id,
          emoji: amount > 0 ? "💎" : "🧾",
          title: amount > 0 ? "ពិន្ទុត្រូវបានបញ្ចូល!" : "ពិន្ទុត្រូវបានកែតម្រូវ",
          body:
            amount > 0
              ? `គណនីរបស់អ្នកទទួលបាន +${amount} ពិន្ទុ 💎 (${reason})`
              : `គណនីរបស់អ្នកត្រូវបានកាត់ ${Math.abs(amount)} ពិន្ទុ (${reason})`,
          href: "/account",
        },
      });

      return { ok: true, balanceAfter: updated.loyaltyPoints };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "អតិថិជននេះមិនមានពិន្ទុគ្រប់គ្រាន់សម្រាប់ការកាត់នេះទេ។" },
        { status: 400 }
      );
    }

    // 🔔 Best-effort Telegram DM, same as the gift flow.
    try {
      const chatId = await resolveUserTelegramChatId(id);
      if (chatId) {
        const msg =
          amount > 0
            ? `💎 <b>ពិន្ទុត្រូវបានបញ្ចូល!</b>\n+${amount} ពិន្ទុ (${reason})`
            : `🧾 <b>ពិន្ទុត្រូវបានកែតម្រូវ</b>\n-${Math.abs(amount)} ពិន្ទុ (${reason})`;
        await sendCustomerAlert(chatId, msg);
      }
    } catch (err) {
      console.error("[telegram] points-adjustment DM failed:", err);
    }

    return NextResponse.json({ success: true, loyaltyPoints: result.balanceAfter });
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}

/** GET /api/admin/customers/[id]/points — recent audit-trail entries. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const rows = await prisma.pointsAdjustment.findMany({
      where: { userId: id },
      include: { admin: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const body: PointsAdjustmentDTO[] = rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      reason: r.reason,
      balanceAfter: r.balanceAfter,
      adminName: r.admin?.name ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
