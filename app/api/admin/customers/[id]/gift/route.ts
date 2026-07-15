import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { resolveUserTelegramChatId, sendCustomerAlert } from "@/lib/telegram";

const schema = z
  .object({
    points: z.number().int().min(0).max(1000000).optional(),
    badge: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(40).optional()
    ),
    message: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(300).optional()
    ),
  })
  .refine((d) => (d.points ?? 0) > 0 || d.badge || d.message, {
    message: "Provide points, a badge, or a message to gift.",
  });

// 👑 Direct Gift/Reward Giver — award custom points, a personalized badge,
// and/or a private thank-you notification to one customer.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
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
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានកាដូមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }
  const { points = 0, badge, message } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "រកមិនឃើញអតិថិជននេះទេ។" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          loyaltyPoints: points > 0 ? { increment: points } : undefined,
          // Append the badge, avoiding duplicates.
          badges:
            badge && !user.badges.includes(badge)
              ? { set: [...user.badges, badge] }
              : undefined,
        },
      });

      // Private notification so the customer sees the gift on their bell.
      const parts: string[] = [];
      if (points > 0) parts.push(`+${points} ពិន្ទុ 💎`);
      if (badge) parts.push(`ផ្លាកសញ្ញា ${badge} 🏅`);
      await tx.notification.create({
        data: {
          userId: id,
          emoji: "🎁",
          title: "អ្នកទទួលបានអំណោយពិសេស!",
          body: message
            ? message
            : `ពួកយើងបានផ្ដល់ជូនអ្នក ${parts.join(" + ")}! អរគុណ Bestie 💖`,
          href: "/account",
        },
      });
      return u;
    });

    // 🔔 Also DM the customer via Telegram if they've linked it (best-effort).
    try {
      const chatId = await resolveUserTelegramChatId(id);
      if (chatId) {
        const parts: string[] = [];
        if (points > 0) parts.push(`+${points} ពិន្ទុ 💎`);
        if (badge) parts.push(`ផ្លាកសញ្ញា ${badge} 🏅`);
        await sendCustomerAlert(
          chatId,
          `🎁 <b>អ្នកទទួលបានអំណោយពិសេស!</b>\n${
            message ? message : `ពួកយើងបានផ្ដល់ជូនអ្នក ${parts.join(" + ")}!`
          } អរគុណ Bestie 💖`
        );
      }
    } catch (err) {
      console.error("[telegram] gift DM failed:", err);
    }

    return NextResponse.json({
      success: true,
      loyaltyPoints: updated.loyaltyPoints,
      badges: updated.badges,
    });
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}
