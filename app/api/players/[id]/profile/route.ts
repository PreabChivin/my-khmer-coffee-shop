import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { ImageOffset, PublicPlayerProfileDTO } from "@/lib/types";

/**
 * GET /api/players/[id]/profile — the public player-inspection card.
 * Requires the REQUESTER to be logged in (no fully-anonymous API access,
 * matching the rest of this app's convention), but returns data about the
 * TARGET user named in the URL. Deliberately narrow: name, points, badges,
 * and equipped items ONLY — never email/phone/passwordHash. Points/badges
 * being peer-visible (not just self/admin) is a new exposure category,
 * introduced deliberately for the avatar-inspection feature.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, loyaltyPoints: true, badges: true },
    });
    if (!target) {
      return NextResponse.json({ error: "រកមិនឃើញអ្នកលេងនេះទេ។" }, { status: 404 });
    }

    const inventory = await prisma.userInventory.findMany({
      where: { userId: id, equipped: true },
      include: { item: true },
    });

    const body: PublicPlayerProfileDTO = {
      id: target.id,
      name: target.name,
      loyaltyPoints: target.loyaltyPoints,
      badges: target.badges,
      equipped: inventory.map((inv) => ({
        category: inv.item.category,
        slug: inv.item.slug,
        name: inv.item.name,
        nameKh: inv.item.nameKh,
        emoji: inv.item.emoji,
        imageUrl: inv.item.imageUrl,
        imageOffset: (inv.item.imageOffset as ImageOffset | null) ?? null,
      })),
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
