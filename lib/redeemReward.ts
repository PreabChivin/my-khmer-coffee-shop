import type { RedemptionHistory, Reward, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendStaffGroupAlert } from "@/lib/telegram";
import { toUserDTO } from "@/lib/userDto";
import type { UserDTO } from "@/lib/types";

// Explicit discriminated-union shape for the transaction's result, tagged
// with a required `ok` field (an optional `error?: undefined` on the
// success branch does NOT reliably exclude it from an `"error" in result`
// check — the property can still be considered "present" as undefined —
// so `result.error` stayed `string | undefined` even after narrowing).
type RedeemTxResult =
  | { ok: false; error: string }
  | { ok: true; redemption: RedemptionHistory; user: User | null; reward: Reward };

const INSUFFICIENT = "INSUFFICIENT_POINTS";

export interface RedeemRewardBody {
  success: true;
  user: UserDTO | null;
  redemption: {
    id: string;
    rewardName: string;
    rewardEmoji: string;
    cost: number;
    status: "PENDING" | "FULFILLED";
    createdAt: string;
  };
}

export type RedeemRewardResult =
  | { ok: true; body: RedeemRewardBody }
  | { ok: false; status: number; error: string };

/**
 * 🎁 Securely redeem a reward for one user. The point deduction uses a
 * guarded updateMany (WHERE loyaltyPoints >= cost) inside a transaction, so
 * it's atomic and can NEVER over-spend, go negative, or double-deduct under
 * concurrent requests — only one request can win the claim. Extracted so the
 * web route (app/api/rewards/redeem) and the mobile-facing
 * app/api/v1/loyalty/rewards/[id]/redeem route share the exact same
 * money-adjacent logic instead of two copies drifting apart.
 */
export async function redeemReward(userId: string, rewardId: string): Promise<RedeemRewardResult> {
  try {
    const result = await prisma.$transaction(async (tx): Promise<RedeemTxResult> => {
      const reward = await tx.reward.findUnique({ where: { id: rewardId } });
      if (!reward || !reward.isAvailable) {
        return { ok: false, error: "This reward is no longer available." };
      }

      // Atomic claim: deducts only if the balance still covers the cost.
      const claim = await tx.user.updateMany({
        where: { id: userId, loyaltyPoints: { gte: reward.cost } },
        data: { loyaltyPoints: { decrement: reward.cost } },
      });
      if (claim.count === 0) {
        return { ok: false, error: INSUFFICIENT };
      }

      const redemption = await tx.redemptionHistory.create({
        data: {
          userId,
          rewardId: reward.id,
          rewardName: reward.name,
          rewardEmoji: reward.emoji,
          cost: reward.cost,
          status: "PENDING",
        },
      });
      const user = await tx.user.findUnique({ where: { id: userId } });
      return { ok: true, redemption, user, reward };
    });

    if (!result.ok) {
      const status = result.error === INSUFFICIENT ? 400 : 409;
      const message =
        result.error === INSUFFICIENT
          ? "You don't have enough points for this reward yet 🥺"
          : result.error;
      return { ok: false, status, error: message };
    }

    // 📣 Flag the redemption to staff (best-effort — never blocks the redeem).
    try {
      await sendStaffGroupAlert(
        `🎁 <b>ការប្ដូររង្វាន់ថ្មី!</b>\n${result.user?.name ?? "Customer"} បានប្ដូរ ${result.reward.emoji} ${result.reward.name} (${result.reward.cost} ពិន្ទុ)។ សូមរៀបចំប្រគល់ជូន!`
      );
    } catch {
      // ignore
    }

    return {
      ok: true,
      body: {
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
      },
    };
  } catch {
    return { ok: false, status: 503, error: "Couldn't redeem right now — please try again." };
  }
}
