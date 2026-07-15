import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { customizationSurcharge, sanitizeCustomization } from "@/lib/customization";
import { computeDiscountedPrice } from "@/lib/pricing";
import { computeAvailableFreeDrinks, isValidPhone, normalizePhone } from "@/lib/loyalty";
import { prizeById } from "@/lib/wheel";
import { sendStaffGroupAlert } from "@/lib/telegram";
import type { SessionPayload } from "@/lib/session";
import type { CheckoutRequestBody, CheckoutResponseBody } from "@/lib/types";

const VALID_ORDER_TYPES = ["PickUp", "Delivery"];
const GROUP_CART_TAKEN = "GROUP_CART_ALREADY_CHECKED_OUT";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type CreateOrderResult =
  | { ok: true; body: CheckoutResponseBody }
  | { ok: false; status: number; error: string };

/**
 * 🧾 The single source of truth for turning a checkout request into a real
 * Order — server-authoritative pricing, group-cart claiming, loyalty
 * redemption, and the staff Telegram alert. Extracted so the web checkout
 * route (app/api/checkout) and the mobile-facing app/api/v1/orders route
 * call the exact same logic instead of two copies drifting apart over time
 * on a payment-adjacent flow. `session` is passed in rather than read from
 * a request here, since the two callers resolve it differently (cookie-only
 * vs. Bearer-or-cookie) — this function doesn't need to know which.
 */
export async function createOrder(
  body: CheckoutRequestBody,
  session: SessionPayload | null
): Promise<CreateOrderResult> {
  const {
    customerName,
    customerPhone,
    orderType,
    items,
    address,
    latitude,
    longitude,
    note,
    fortune,
    spinPrize,
    redeemFreeDrinkIndex,
    isGift,
    giftRecipientName,
    giftMessage,
    groupCartId,
    telegramSessionToken,
  } = body;

  // 🎡 Only accept a spin prize that maps to a real wheel segment.
  const validSpinPrize =
    typeof spinPrize === "string" && prizeById(spinPrize) ? spinPrize : null;

  // 📍 The pin dropped in the map picker — optional (absent for PickUp
  // orders or an address typed via the picker's manual-entry fallback).
  const validLatitude =
    typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 90
      ? latitude
      : null;
  const validLongitude =
    typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180
      ? longitude
      : null;

  if (!customerName?.trim() || !customerPhone?.trim()) {
    return { ok: false, status: 400, error: "តម្រូវឲ្យមានឈ្មោះ និងលេខទូរស័ព្ទរបស់អតិថិជន។" };
  }

  // 📱 Latin digits only, 8-15 of them — mirrors the client-side sanitizer
  // (lib/loyalty.ts) but re-checked server-side since that's trivially
  // bypassable from a raw request.
  if (!isValidPhone(customerPhone)) {
    return { ok: false, status: 400, error: "លេខទូរស័ព្ទត្រូវមានលេខ ៨ ទៅ ១៥ ខ្ទង់ (លេខ 0-9 ប៉ុណ្ណោះ)។" };
  }

  if (!VALID_ORDER_TYPES.includes(orderType)) {
    return { ok: false, status: 400, error: "ប្រភេទការកម្ម៉ង់ត្រូវតែជា 'PickUp' ឬ 'Delivery'។" };
  }

  if (orderType === "Delivery" && !address?.trim()) {
    return { ok: false, status: 400, error: "តម្រូវឲ្យមានអាសយដ្ឋានសម្រាប់ការកម្ម៉ង់ដឹកជញ្ជូន។" };
  }

  if (isGift && !giftRecipientName?.trim()) {
    return { ok: false, status: 400, error: "តម្រូវឲ្យមានឈ្មោះអ្នកទទួលកាដូ នៅពេលជ្រើសរើសកាដូ។" };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, status: 400, error: "ត្រូវមានទំនិញយ៉ាងហោចណាស់មួយក្នុងការកម្ម៉ង់។" };
  }

  for (const item of items) {
    if (
      typeof item.productId !== "string" ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      !Number.isInteger(item.quantity)
    ) {
      return { ok: false, status: 400, error: "ទំនិញនីមួយៗត្រូវមានលេខផលិតផល និងចំនួនត្រឹមត្រូវ។" };
    }
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { ok: false, status: 400, error: `រកមិនឃើញផលិតផល ${item.productId} ទេ។` };
    }
    if (!product.isAvailable) {
      return { ok: false, status: 400, error: `${product.nameEn} បច្ចុប្បន្នអស់ពីស្តុកហើយ។` };
    }
  }

  // Build line items with server-authoritative pricing: the customization is
  // re-sanitized against the product category here so a client can never inject
  // arbitrary modifiers or a discounted surcharge. Unit price = discounted
  // base + shots — the discount percent is read from the DB, never trusted
  // from the client.
  const lineItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const customization = sanitizeCustomization(product.category.name, item.customization);
    const discountedBase = computeDiscountedPrice(
      product.price,
      product.discountPercent,
      product.flatDiscount
    );
    const unitPrice = round2(discountedBase + customizationSurcharge(customization));
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

  let totalAmount = round2(lineItems.reduce((sum, line) => sum + line.price * line.quantity, 0));

  // 🐻 Free-drink redemption: re-verified server-side against the loyalty
  // account, never trusted from the client. Discounts exactly one unit of the
  // chosen line.
  const normalizedPhone = normalizePhone(customerPhone);
  let redeemedFreeDrinks = 0;
  const hasValidRedeemIndex =
    typeof redeemFreeDrinkIndex === "number" &&
    Number.isInteger(redeemFreeDrinkIndex) &&
    redeemFreeDrinkIndex >= 0 &&
    redeemFreeDrinkIndex < lineItems.length;

  if (hasValidRedeemIndex) {
    const account = await prisma.loyaltyAccount.findUnique({ where: { phone: normalizedPhone } });
    const available = account
      ? computeAvailableFreeDrinks(account.stampCount, account.freeDrinksRedeemed)
      : 0;
    if (available > 0) {
      const redemptionDiscount = lineItems[redeemFreeDrinkIndex!].price;
      totalAmount = round2(Math.max(0, totalAmount - redemptionDiscount));
      redeemedFreeDrinks = 1;
    }
  }

  // Typed explicitly as the unchecked-create variant so Prisma accepts the
  // JSONB customizations column. Prisma.DbNull writes a true SQL NULL for
  // non-customizable items; a typed interface must be cast to InputJsonValue.
  const itemsCreate: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = lineItems.map(
    (line) => ({
      productId: line.productId,
      quantity: line.quantity,
      price: line.price,
      customizations:
        line.customization === null
          ? Prisma.DbNull
          : (line.customization as unknown as Prisma.InputJsonValue),
      contributorName: line.contributorName,
    })
  );

  const orderId = randomUUID();
  const isGiftOrder = Boolean(isGift && giftRecipientName?.trim());

  // 👤 Link this order to the customer's account if they're logged in. The
  // session is resolved by the caller (never trusted from the request body),
  // so a client can't attribute an order to someone else's account.
  const linkedUserId = session
    ? (await prisma.user.findUnique({ where: { id: session.id }, select: { id: true } }))?.id ?? null
    : null;

  // 🔔 If this device connected Telegram from the header, resolve the saved
  // chat so this order is auto-notified on status changes. Best-effort — a
  // missing/unknown token just means no Telegram link, never a checkout error.
  let linkedTelegramChatId: string | null = null;
  if (typeof telegramSessionToken === "string" && telegramSessionToken.trim()) {
    try {
      const tgSession = await prisma.telegramSession.findUnique({
        where: { token: telegramSessionToken.trim() },
      });
      linkedTelegramChatId = tgSession?.chatId ?? null;
    } catch {
      // notification linking is non-critical — proceed with the order
    }
  }

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
          latitude: validLatitude,
          longitude: validLongitude,
          note: note?.trim() || null,
          fortune:
            typeof fortune === "string" && fortune.trim() ? fortune.trim().slice(0, 300) : null,
          spinPrize: validSpinPrize,
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
          customerTelegramChatId: linkedTelegramChatId,
          userId: linkedUserId,
          items: { create: itemsCreate },
        },
      });

      await tx.payment.create({
        data: { orderId: createdOrder.id, paymentMethod: "KHQR", paymentStatus: "UNPAID" },
      });

      if (groupCartId) {
        await tx.groupCart.update({ where: { id: groupCartId }, data: { orderId: createdOrder.id } });
      }

      return createdOrder;
    });

    // 📣 Channel 1 — instant staff group ping the moment an order lands,
    // separate from the later "customer says they paid" alert. Best-effort:
    // a Telegram outage must never fail a checkout that already succeeded.
    try {
      const shortId = order.id.slice(0, 8).toUpperCase();
      const itemCount = lineItems.reduce((sum, line) => sum + line.quantity, 0);
      await sendStaffGroupAlert(
        `🆕 <b>ការកម្ម៉ង់ថ្មី!</b>\n` +
          `ការកម្ម៉ង់ #${shortId} — ${customerName.trim()} (${customerPhone.trim()})\n` +
          `🧋 ${itemCount} item${itemCount === 1 ? "" : "s"} · 💵 $${totalAmount.toFixed(2)}\n` +
          `${orderType === "Delivery" ? "🛵 ដឹកជញ្ជូន" : "🏠 មកយកខ្លួនឯង"}${isGiftOrder ? " · 🎁 កាដូ" : ""}\n` +
          `រង់ចាំការទូទាត់... 👀`
      );
    } catch (err) {
      console.error("[telegram] Failed to send new-order staff alert:", err);
    }

    return {
      ok: true,
      body: { orderId: order.id, totalAmount, isGift: isGiftOrder },
    };
  } catch (error) {
    if (error instanceof Error && error.message === GROUP_CART_TAKEN) {
      return { ok: false, status: 409, error: "កន្ត្រកមិត្តភ័ក្តិនេះបានទូទាត់រួចហើយ។" };
    }
    console.error("Checkout failed:", error);
    return { ok: false, status: 500, error: "បង្កើតការកម្ម៉ង់មិនជោគជ័យទេ សូមព្យាយាមម្តងទៀត។" };
  }
}
