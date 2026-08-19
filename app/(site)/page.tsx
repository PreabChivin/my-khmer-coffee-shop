import { prisma } from "@/lib/prisma";
import HomeContent from "@/components/home/HomeContent";
import type { PublicShopItemDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Public avatar-shop catalog (no ownership info) — used by the homepage's
 *  Pet Zoo, which is visible to guests too, so it can't go through the
 *  session-gated /api/shop/items. */
async function getShopCatalog(): Promise<PublicShopItemDTO[]> {
  const items = await prisma.shopItem.findMany({
    where: { isAvailable: true },
    orderBy: { cost: "asc" },
  });
  return items.map((i) => ({
    id: i.id,
    slug: i.slug,
    name: i.name,
    nameKh: i.nameKh,
    category: i.category,
    tier: i.tier,
    cost: i.cost,
    emoji: i.emoji,
  }));
}

export default async function HomePage() {
  const items = await getShopCatalog();
  return <HomeContent shopItems={items} />;
}
