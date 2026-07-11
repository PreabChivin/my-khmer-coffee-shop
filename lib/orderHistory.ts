import type { Prisma } from "@prisma/client";
import type {
  OrderHistoryItemDTO,
  OrderStatus,
  OrderType,
  PaymentStatus,
} from "@/lib/types";

type OrderWithHistory = Prisma.OrderGetPayload<{
  include: {
    payment: true;
    items: { include: { product: true } };
  };
}>;

/** Maps a Prisma order (with payment + items+product) to the shared,
 *  public-safe order-history row used by both the customer and admin views. */
export function toOrderHistoryItem(order: OrderWithHistory): OrderHistoryItemDTO {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    orderStatus: order.orderStatus as OrderStatus,
    orderType: order.orderType as OrderType,
    totalAmount: order.totalAmount,
    paymentStatus: (order.payment?.paymentStatus as PaymentStatus) ?? null,
    paymentMethod: order.payment?.paymentMethod ?? null,
    pointsAwarded: order.pointsAwarded,
    timeline: {
      placedAt: order.createdAt.toISOString(),
      preparingAt: order.preparingAt?.toISOString() ?? null,
      readyAt: order.readyAt?.toISOString() ?? null,
      completedAt: order.completedAt?.toISOString() ?? null,
    },
    items: order.items.map((item) => ({
      nameEn: item.product.nameEn,
      nameKh: item.product.nameKh,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}
