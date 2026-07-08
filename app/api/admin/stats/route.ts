import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export interface AdminStatsResponseBody {
  dailyEarnings: number;
  activeGroupCarts: number;
  topSellers: { productId: string; nameEn: string; nameKh: string; totalSold: number }[];
}

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaysOrders, activeGroupCarts, topSellerRows] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
        payment: { paymentStatus: "PAID" },
      },
      select: { totalAmount: true },
    }),
    prisma.groupCart.count({ where: { status: "OPEN" } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 3,
    }),
  ]);

  const dailyEarnings = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const products = await prisma.product.findMany({
    where: { id: { in: topSellerRows.map((r) => r.productId) } },
    select: { id: true, nameEn: true, nameKh: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const topSellers = topSellerRows
    .map((row) => {
      const product = productMap.get(row.productId);
      if (!product) return null;
      return {
        productId: row.productId,
        nameEn: product.nameEn,
        nameKh: product.nameKh,
        totalSold: row._sum.quantity ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const body: AdminStatsResponseBody = {
    dailyEarnings,
    activeGroupCarts,
    topSellers,
  };

  return NextResponse.json(body);
}
