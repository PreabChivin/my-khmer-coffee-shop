import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { bumpMissionProgress } from "@/lib/missionProgress";

const NOT_OWNED = "NOT_OWNED";

/**
 * POST /api/shop/equip — Body: { itemId, equip: boolean }
 * "At most one equipped item per category" is enforced here at the
 * application layer (unequip any other owned item in the same category
 * first), not a DB constraint — same pattern as everywhere else this
 * schema uses transactions over exotic constraints.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { itemId?: string; equip?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  if (!body.itemId || typeof body.itemId !== "string" || typeof body.equip !== "boolean") {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const { itemId, equip } = body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const owned = await tx.userInventory.findUnique({
        where: { userId_itemId: { userId: session.id, itemId } },
        include: { item: true },
      });
      if (!owned) {
        return { ok: false as const, error: NOT_OWNED };
      }

      if (equip) {
        // Unequip any other owned item in the same category first.
        await tx.userInventory.updateMany({
          where: { userId: session.id, equipped: true, item: { category: owned.item.category } },
          data: { equipped: false },
        });
      }
      await tx.userInventory.update({
        where: { userId_itemId: { userId: session.id, itemId } },
        data: { equipped: equip },
      });

      if (equip) {
        await bumpMissionProgress(tx, session.id, "equip_avatar_item_daily");
      }
      return { ok: true as const };
    });

    if (!result.ok) {
      return NextResponse.json({ error: "អ្នកមិនទាន់មានវត្ថុនេះទេ។" }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចផ្លាស់ប្តូរបានទេឥឡូវនេះ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
