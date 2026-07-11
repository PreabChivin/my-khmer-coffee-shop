import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { resolveUserTelegramChatId, sendCustomerAlert } from "@/lib/telegram";

// 🎟️ Draw a winner: picks a random eligible customer (lifetime points >=
// the draw's minPoints threshold) that hasn't already won this draw, records
// them, and sends the winner a private notification. Idempotency: a draw that
// already has a winner can't be re-drawn.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const draw = await prisma.luckyDraw.findUnique({ where: { id } });
    if (!draw) {
      return NextResponse.json({ error: "Draw not found" }, { status: 404 });
    }
    if (draw.winnerId) {
      return NextResponse.json(
        { error: "This draw already has a winner." },
        { status: 409 }
      );
    }

    const eligible = await prisma.user.findMany({
      where: { loyaltyPoints: { gte: draw.minPoints } },
      select: { id: true, name: true },
    });
    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No eligible customers meet the criteria yet." },
        { status: 400 }
      );
    }

    const winner = eligible[Math.floor(Math.random() * eligible.length)];

    // Claim atomically so two concurrent draws can't pick two winners.
    const claim = await prisma.luckyDraw.updateMany({
      where: { id, winnerId: null },
      data: { winnerId: winner.id, winnerName: winner.name, drawnAt: new Date() },
    });
    if (claim.count === 0) {
      return NextResponse.json(
        { error: "This draw already has a winner." },
        { status: 409 }
      );
    }

    // 🔔 Notify the winner — in-app bell + a Telegram DM if they've linked it.
    const winMessage = `អ្នកបានឈ្នះ ${draw.prizeEmoji} ${draw.prizeName} ក្នុងការចាប់រង្វាន់ «${draw.title}»! សូមទាក់ទងបុគ្គលិកដើម្បីទទួល 💖`;
    try {
      await prisma.notification.create({
        data: {
          userId: winner.id,
          emoji: draw.prizeEmoji,
          title: "🎉 អបអរសាទរ! អ្នកបានឈ្នះរង្វាន់!",
          body: winMessage,
          href: "/account",
        },
      });
    } catch {
      // ignore — the winner is still recorded
    }
    try {
      const chatId = await resolveUserTelegramChatId(winner.id);
      if (chatId) {
        await sendCustomerAlert(
          chatId,
          `🎉 <b>អបអរសាទរ ${winner.name}!</b>\n${winMessage}`
        );
      }
    } catch (err) {
      console.error("[telegram] draw winner DM failed:", err);
    }

    return NextResponse.json({
      success: true,
      winnerName: winner.name,
      eligibleCount: eligible.length,
    });
  } catch {
    return NextResponse.json({ error: "The database is busy." }, { status: 503 });
  }
}
