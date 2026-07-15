import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export interface AdminStatsResponseBody {
  dailyEarnings: number;
  activeOrders: number;
  activeGroupCarts: number;
  topSellers: { productId: string; nameEn: string; nameKh: string; totalSold: number }[];
  topSpins: { prizeId: string; count: number }[];
}

const ACTIVE_ORDER_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "PREPARING", "READY"];

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todaysOrders, activeOrders, activeGroupCarts, topSellerRows, topSpinRows] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfDay },
          payment: { paymentStatus: "PAID" },
        },
        select: { totalAmount: true },
      }),
      prisma.order.count({ where: { orderStatus: { in: ACTIVE_ORDER_STATUSES } } }),
      prisma.groupCart.count({ where: { status: "OPEN" } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 3,
      }),
      prisma.order.groupBy({
        by: ["spinPrize"],
        where: { spinPrize: { not: null } },
        _count: { spinPrize: true },
        orderBy: { _count: { spinPrize: "desc" } },
        take: 3,
      }),
    ]);

  const dailyEarnings = todaysOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const topSpins = topSpinRows
    .filter((row) => row.spinPrize)
    .map((row) => ({
      prizeId: row.spinPrize as string,
      count: row._count.spinPrize,
    }));

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
    activeOrders,
    activeGroupCarts,
    topSellers,
    topSpins,
  };

  return NextResponse.json(body);
}
