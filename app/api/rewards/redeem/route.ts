import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { sendStaffGroupAlert } from "@/lib/telegram";
import { toUserDTO } from "@/lib/userDto";

const INSUFFICIENT = "INSUFFICIENT_POINTS";

// 🎁 Securely redeem a reward. The point deduction uses a guarded updateMany
// (WHERE loyaltyPoints >= cost) inside a transaction, so it's atomic and can
// NEVER over-spend, go negative, or double-deduct under concurrent requests —
// only one request can win the claim. A RedemptionHistory row (PENDING) is
// logged for staff to fulfil.
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { rewardId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.rewardId || typeof body.rewardId !== "string") {
    return NextResponse.json({ error: "rewardId is required" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({ where: { id: body.rewardId } });
      if (!reward || !reward.isAvailable) {
        return { error: "This reward is no longer available." as string };
      }

      // Atomic claim: deducts only if the balance still covers the cost.
      const claim = await tx.user.updateMany({
        where: { id: session.id, loyaltyPoints: { gte: reward.cost } },
        data: { loyaltyPoints: { decrement: reward.cost } },
      });
      if (claim.count === 0) {
        return { error: INSUFFICIENT };
      }

      const redemption = await tx.redemptionHistory.create({
        data: {
          userId: session.id,
          rewardId: reward.id,
          rewardName: reward.name,
          rewardEmoji: reward.emoji,
          cost: reward.cost,
          status: "PENDING",
        },
      });
      const user = await tx.user.findUnique({ where: { id: session.id } });
      return { redemption, user, reward };
    });

    if ("error" in result) {
      const status = result.error === INSUFFICIENT ? 400 : 409;
      const message =
        result.error === INSUFFICIENT
          ? "You don't have enough points for this reward yet 🥺"
          : result.error;
      return NextResponse.json({ error: message }, { status });
    }

    // 📣 Flag the redemption to staff (best-effort — never blocks the redeem).
    try {
      await sendStaffGroupAlert(
        `🎁 <b>ការប្ដូររង្វាន់ថ្មី!</b>\n${result.user?.name ?? "Customer"} បានប្ដូរ ${result.reward.emoji} ${result.reward.name} (${result.reward.cost} ពិន្ទុ)។ សូមរៀបចំប្រគល់ជូន!`
      );
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      user: result.user ? toUserDTO(result.user) : null,
      redemption: {
        id: result.redemption.id,
        rewardName: result.redemption.rewardName,
        rewardEmoji: result.redemption.rewardEmoji,
        cost: result.redemption.cost,
        status: result.redemption.status as "PENDING" | "FULFILLED",
        createdAt: result.redemption.createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't redeem right now — please try again." },
      { status: 503 }
    );
  }
}
