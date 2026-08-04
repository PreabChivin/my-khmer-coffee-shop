import type { ShopItem, User, UserInventory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toUserDTO } from "@/lib/userDto";
import type { UserDTO } from "@/lib/types";

type PurchaseTxResult =
  | { ok: false; error: string }
  | { ok: true; inventory: UserInventory; user: User | null; item: ShopItem };

const INSUFFICIENT = "INSUFFICIENT_POINTS";
const ALREADY_OWNED = "ALREADY_OWNED";

export interface PurchaseShopItemBody {
  success: true;
  user: UserDTO | null;
  itemId: string;
}

export type PurchaseShopItemResult =
  | { ok: true; body: PurchaseShopItemBody }
  | { ok: false; status: number; error: string };

/** 🎩 Buy one Avatar Shop item — the exact guarded-transaction pattern as
 *  `lib/redeemReward.ts` (atomic `updateMany` on `loyaltyPoints >= cost`, so
 *  it can never over-spend or double-deduct under concurrency), just without
 *  the staff Telegram alert since a cosmetic purchase needs no physical
 *  fulfillment. Cosmetics are single-owned — `UserInventory`'s
 *  `@@unique([userId, itemId])` makes a second purchase a no-op error. */
export async function purchaseShopItem(
  userId: string,
  itemId: string
): Promise<PurchaseShopItemResult> {
  try {
    const result = await prisma.$transaction(async (tx): Promise<PurchaseTxResult> => {
      const item = await tx.shopItem.findUnique({ where: { id: itemId } });
      if (!item || !item.isAvailable) {
        return { ok: false, error: "វត្ថុនេះលែងមានទៀតហើយ។" };
      }

      const owned = await tx.userInventory.findUnique({
        where: { userId_itemId: { userId, itemId } },
      });
      if (owned) {
        return { ok: false, error: ALREADY_OWNED };
      }

      // Atomic claim: deducts only if the balance still covers the cost.
      const claim = await tx.user.updateMany({
        where: { id: userId, loyaltyPoints: { gte: item.cost } },
        data: { loyaltyPoints: { decrement: item.cost } },
      });
      if (claim.count === 0) {
        return { ok: false, error: INSUFFICIENT };
      }

      const inventory = await tx.userInventory.create({
        data: { userId, itemId: item.id },
      });
      const user = await tx.user.findUnique({ where: { id: userId } });
      return { ok: true, inventory, user, item };
    });

    if (!result.ok) {
      const status = result.error === ALREADY_OWNED ? 409 : 400;
      const message =
        result.error === INSUFFICIENT
          ? "អ្នកមិនទាន់មានពិន្ទុគ្រប់គ្រាន់សម្រាប់វត្ថុនេះទេ 🥺"
          : result.error === ALREADY_OWNED
            ? "អ្នកមានវត្ថុនេះរួចហើយ។"
            : result.error;
      return { ok: false, status, error: message };
    }

    return {
      ok: true,
      body: {
        success: true,
        user: result.user ? toUserDTO(result.user) : null,
        itemId: result.item.id,
      },
    };
  } catch {
    return { ok: false, status: 503, error: "មិនអាចទិញវត្ថុនេះបានទេឥឡូវនេះ សូមព្យាយាមម្តងទៀត។" };
  }
}
