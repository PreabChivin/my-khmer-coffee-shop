import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderStatusResponseBody } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const body: OrderStatusResponseBody = {
    orderId: order.id,
    orderStatus: order.orderStatus as OrderStatusResponseBody["orderStatus"],
    paymentStatus:
      (order.payment?.paymentStatus as OrderStatusResponseBody["paymentStatus"]) ??
      null,
    customerRating: order.customerRating,
  };

  return NextResponse.json(body);
}
