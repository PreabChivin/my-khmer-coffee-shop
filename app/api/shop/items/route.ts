import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { Model3DDescriptor, ShopItemDTO } from "@/lib/types";

/** GET /api/shop/items — the Avatar Shop catalog, plus this user's
 *  ownership/equip state for each item. */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const [items, owned] = await Promise.all([
      prisma.shopItem.findMany({ where: { isAvailable: true }, orderBy: { cost: "asc" } }),
      prisma.userInventory.findMany({ where: { userId: session.id } }),
    ]);
    const ownedByItemId = new Map(owned.map((o) => [o.itemId, o]));

    const body: ShopItemDTO[] = items.map((item) => {
      const own = ownedByItemId.get(item.id);
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        nameKh: item.nameKh,
        category: item.category,
        tier: item.tier,
        cost: item.cost,
        emoji: item.emoji,
        description: item.description,
        model3d: (item.model3d as Model3DDescriptor | null) ?? null,
        owned: Boolean(own),
        equipped: Boolean(own?.equipped),
      };
    });

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
