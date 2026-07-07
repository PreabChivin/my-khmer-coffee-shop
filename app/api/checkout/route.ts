import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CheckoutRequestBody, CheckoutResponseBody } from "@/lib/types";

const VALID_ORDER_TYPES = ["PickUp", "Delivery"];

export async function POST(request: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customerName, customerPhone, orderType, items, address, note } =
    body;

  if (!customerName?.trim() || !customerPhone?.trim()) {
    return NextResponse.json(
      { error: "customerName and customerPhone are required" },
      { status: 400 }
    );
  }

  if (!VALID_ORDER_TYPES.includes(orderType)) {
    return NextResponse.json(
      { error: "orderType must be 'PickUp' or 'Delivery'" },
      { status: 400 }
    );
  }

  if (orderType === "Delivery" && !address?.trim()) {
    return NextResponse.json(
      { error: "address is required for delivery orders" },
      { status: 400 }
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "items must be a non-empty array" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (
      typeof item.productId !== "string" ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity)
    ) {
      return NextResponse.json(
        { error: "Each item requires a valid productId and quantity" },
        { status: 400 }
      );
    }
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} not found` },
        { status: 400 }
      );
    }
    if (!product.isAvailable) {
      return NextResponse.json(
        { error: `${product.nameEn} is currently out of stock` },
        { status: 400 }
      );
    }
  }

  const totalAmount = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const roundedTotal = Math.round(totalAmount * 100) / 100;
  const orderId = randomUUID();

  try {
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderType,
          address: address?.trim() || null,
          note: note?.trim() || null,
          totalAmount: roundedTotal,
          orderStatus: "PENDING",
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
              };
            }),
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          paymentMethod: "KHQR",
          paymentStatus: "UNPAID",
        },
      });

      return createdOrder;
    });

    const responseBody: CheckoutResponseBody = {
      orderId: order.id,
      totalAmount: roundedTotal,
    };

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error("Checkout failed:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
