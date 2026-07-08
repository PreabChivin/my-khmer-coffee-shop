import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  customizationSurcharge,
  sanitizeCustomization,
} from "@/lib/customization";
import { computeAvailableFreeDrinks, normalizePhone } from "@/lib/loyalty";
import type { CheckoutRequestBody, CheckoutResponseBody } from "@/lib/types";

const VALID_ORDER_TYPES = ["PickUp", "Delivery"];
const GROUP_CART_TAKEN = "GROUP_CART_ALREADY_CHECKED_OUT";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function POST(request: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    customerName,
    customerPhone,
    orderType,
    items,
    address,
    note,
    fortune,
    redeemFreeDrinkIndex,
    isGift,
    giftRecipientName,
    giftMessage,
    groupCartId,
  } = body;

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

  if (isGift && !giftRecipientName?.trim()) {
    return NextResponse.json(
      { error: "giftRecipientName is required when isGift is true" },
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

  // Build line items with server-authoritative pricing: the customization is
  // re-sanitized against the product category here so a client can never inject
  // arbitrary modifiers or a discounted surcharge. Unit price = base + shots.
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const customization = sanitizeCustomization(
      product.category,
      item.customization
    );
    const unitPrice = round2(
      product.price + customizationSurcharge(customization)
    );
    return {
      productId: product.id,
      quantity: item.quantity,
      price: unitPrice,
      customization,
      contributorName:
        typeof item.contributorName === "string" && item.contributorName.trim()
          ? item.contributorName.trim().slice(0, 60)
          : null,
    };
  });

  let totalAmount = round2(
    lineItems.reduce((sum, line) => sum + line.price * line.quantity, 0)
  );

  // 🐻 Free-drink redemption: re-verified server-side against the loyalty
  // account, never trusted from the client. Discounts exactly one unit of the
  // chosen line.
  const normalizedPhone = normalizePhone(customerPhone);
  let redeemedFreeDrinks = 0;
  let redemptionDiscount = 0;
  const hasValidRedeemIndex =
    typeof redeemFreeDrinkIndex === "number" &&
    Number.isInteger(redeemFreeDrinkIndex) &&
    redeemFreeDrinkIndex >= 0 &&
    redeemFreeDrinkIndex < lineItems.length;

  if (hasValidRedeemIndex) {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { phone: normalizedPhone },
    });
    const available = account
      ? computeAvailableFreeDrinks(account.stampCount, account.freeDrinksRedeemed)
      : 0;
    if (available > 0) {
      redemptionDiscount = lineItems[redeemFreeDrinkIndex!].price;
      totalAmount = round2(Math.max(0, totalAmount - redemptionDiscount));
      redeemedFreeDrinks = 1;
    }
  }

  // Typed explicitly as the unchecked-create variant so Prisma accepts the
  // JSONB customizations column. Prisma.DbNull writes a true SQL NULL for
  // non-customizable items; a typed interface must be cast to InputJsonValue.
  const itemsCreate: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
    lineItems.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      price: line.price,
      customizations:
        line.customization === null
          ? Prisma.DbNull
          : (line.customization as unknown as Prisma.InputJsonValue),
      contributorName: line.contributorName,
    }));

  const orderId = randomUUID();
  const isGiftOrder = Boolean(isGift && giftRecipientName?.trim());

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Claim the group cart FIRST (if any) so two people racing to check out
      // the same Bestie Cart can't both succeed — only one updateMany matches.
      if (groupCartId) {
        const claim = await tx.groupCart.updateMany({
          where: { id: groupCartId, status: "OPEN" },
          data: { status: "CHECKED_OUT" },
        });
        if (claim.count === 0) {
          throw new Error(GROUP_CART_TAKEN);
        }
      }

      if (redeemedFreeDrinks > 0) {
        await tx.loyaltyAccount.update({
          where: { phone: normalizedPhone },
          data: { freeDrinksRedeemed: { increment: redeemedFreeDrinks } },
        });
      }

      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderType,
          address: address?.trim() || null,
          note: note?.trim() || null,
          fortune:
            typeof fortune === "string" && fortune.trim()
              ? fortune.trim().slice(0, 300)
              : null,
          totalAmount,
          orderStatus: "PENDING",
          redeemedFreeDrinks,
          isGift: isGiftOrder,
          giftRecipientName: isGiftOrder ? giftRecipientName!.trim().slice(0, 80) : null,
          giftMessage:
            isGiftOrder && typeof giftMessage === "string" && giftMessage.trim()
              ? giftMessage.trim().slice(0, 300)
              : null,
          isGroupOrder: Boolean(groupCartId),
          items: {
            create: itemsCreate,
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

      if (groupCartId) {
        await tx.groupCart.update({
          where: { id: groupCartId },
          data: { orderId: createdOrder.id },
        });
      }

      return createdOrder;
    });

    const responseBody: CheckoutResponseBody = {
      orderId: order.id,
      totalAmount,
      isGift: isGiftOrder,
    };

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === GROUP_CART_TAKEN) {
      return NextResponse.json(
        { error: "This Bestie Cart has already been checked out." },
        { status: 409 }
      );
    }
    console.error("Checkout failed:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
