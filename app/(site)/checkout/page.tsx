"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFulfillment } from "@/contexts/FulfillmentContext";
import StaticPaymentModal from "@/components/StaticPaymentModal";
import OrderSuccess from "@/components/OrderSuccess";
import StampCard from "@/components/StampCard";
import { customizationSurcharge, describeCustomization } from "@/lib/customization";
import { randomFortune, type Fortune } from "@/lib/fortunes";
import { normalizePhone } from "@/lib/loyalty";
import { getTelegramSessionToken } from "@/lib/telegramSession";
import { localizedName } from "@/lib/i18n";
import type {
  CheckoutResponseBody,
  DrinkCustomization,
  LoyaltyStatusResponseBody,
  OrderType,
} from "@/lib/types";

interface CheckoutState {
  orderId: string;
  totalAmount: number;
  isGift: boolean;
}

/** Unified checkout line, sourced from either the personal cart or a shared
 *  Bestie Cart — lets the rest of the page not care which one is active. */
interface CheckoutLine {
  key: string;
  name: string;
  unitPrice: number;
  quantity: number;
  customization: DrinkCustomization | null;
  contributorName: string | null;
  productId: string;
}

export default function CheckoutPage() {
  const { items, clearCart, vibe, spinPrize } = useCart();
  const {
    isGroupMode,
    groupId,
    state: groupState,
    leaveGroupSession,
  } = useGroupCart();
  const { lang, t } = useLanguage();
  // Fulfillment choice (Delivery/Pick-up + address) carries over from the
  // homepage fulfillment bar so the customer doesn't re-enter it here.
  const { orderType, address, setOrderType, setAddress } = useFulfillment();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  // 🔮 Destiny Cup fortune assigned to this order at checkout.
  const [fortune, setFortune] = useState<Fortune | null>(null);
  // 🎡 Wheel prize captured at submit (cart clears on approval).
  const [submittedPrize, setSubmittedPrize] = useState<string | null>(null);

  // 🐻 Loyalty status, fetched (debounced) as the phone number is typed —
  // not available for Bestie Cart group orders (ambiguous whose stamps).
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatusResponseBody | null>(
    null
  );
  const [wantRedeem, setWantRedeem] = useState(false);
  const [redeemIndex, setRedeemIndex] = useState(0);
  const normalizedPhone = normalizePhone(customerPhone);

  useEffect(() => {
    if (isGroupMode || normalizedPhone.length < 6) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoyaltyStatus(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/loyalty/${normalizedPhone}`);
        if (!res.ok || cancelled) return;
        setLoyaltyStatus(await res.json());
      } catch {
        // transient network hiccup — the user can still check out
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedPhone, isGroupMode]);

  // 💖 Gift a Drink
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const lines: CheckoutLine[] = isGroupMode
    ? (groupState?.items ?? []).map((item) => ({
        key: item.id,
        name: localizedName(
          { nameEn: item.product.nameEn, nameKh: item.product.nameKh },
          lang
        ),
        unitPrice: item.product.price + customizationSurcharge(item.customization),
        quantity: item.quantity,
        customization: item.customization,
        contributorName: item.contributorName,
        productId: item.productId,
      }))
    : items.map((item) => ({
        key: item.lineId,
        name: lang === "km" ? item.nameKh : item.nameEn,
        unitPrice: item.price,
        quantity: item.quantity,
        customization: item.customization,
        contributorName: null,
        productId: item.productId,
      }));

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Prefer the "Daily Vibe Check" the customer already shook in the cart.
    const chosenFortune = vibe ?? randomFortune();
    setFortune(chosenFortune);
    setSubmittedPrize(!isGroupMode ? spinPrize : null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          orderType,
          address: orderType === "Delivery" ? address : undefined,
          note: note || undefined,
          fortune: chosenFortune.km,
          spinPrize: !isGroupMode ? spinPrize : null,
          redeemFreeDrinkIndex: !isGroupMode && wantRedeem ? redeemIndex : null,
          isGift,
          giftRecipientName: isGift ? giftRecipientName : undefined,
          giftMessage: isGift ? giftMessage : undefined,
          groupCartId: isGroupMode ? groupId : undefined,
          // 🔔 Links this order to the customer's Telegram if they connected
          // from the header on this device (null/absent otherwise).
          telegramSessionToken: getTelegramSessionToken(),
          items: lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            customization: line.customization,
            contributorName: line.contributorName,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      const result = data as CheckoutResponseBody;
      setCheckout(result);
      // Remember the phone (device-local only) so the homepage sidebar can
      // show this customer's loyalty stamps on their next visit.
      try {
        window.localStorage.setItem("cafe-last-phone", customerPhone.trim());
      } catch {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleApproved() {
    setIsApproved(true);
    if (isGroupMode) leaveGroupSession();
    else clearCart();
  }

  if (isApproved && checkout) {
    return (
      <OrderSuccess
        orderId={checkout.orderId}
        orderType={orderType}
        fortune={fortune}
        isGift={checkout.isGift}
        spinPrize={submittedPrize}
      />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="font-heading text-2xl text-coffee-900 dark:text-cream-50">
          {isGroupMode ? t("group.bannerTitle") : t("checkout.emptyCartTitle")}
        </h1>
        <p className="mt-2 text-coffee-500 dark:text-cream-300">
          {isGroupMode ? t("group.empty") : t("checkout.emptyCartHint")}
        </p>
        <Link
          href={isGroupMode ? `/menu?group=${groupId}` : "/menu"}
          className="mt-6 rounded-xl bg-gold-500 px-6 py-3 font-semibold text-coffee-900 hover:bg-gold-600"
        >
          {t("checkout.browseMenu")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 font-heading text-3xl text-coffee-900 dark:text-cream-50">
        {t("checkout.title")}
      </h1>

      <div className="grid gap-8 md:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="khmer-card space-y-5 rounded-2xl bg-cream-50 p-6 dark:bg-coffee-800 md:col-span-3"
        >
          {isGroupMode && (
            <p className="rounded-xl bg-clay-50 px-4 py-2.5 text-xs font-medium text-clay-600 dark:bg-coffee-900 dark:text-clay-400">
              {t("group.checkoutNote")}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
              {t("checkout.fullName")}
            </label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              placeholder={t("checkout.namePlaceholder")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
              {t("checkout.phone")}
            </label>
            <input
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              placeholder={t("checkout.phonePlaceholder")}
            />
          </div>

          {/* 🐻 Cute Bear Stamps — hidden for Bestie Cart group orders */}
          {!isGroupMode && loyaltyStatus && (
            <div className="space-y-2">
              <StampCard
                stampsTowardNext={loyaltyStatus.stampsTowardNext}
                availableFreeDrinks={loyaltyStatus.availableFreeDrinks}
              />
              {loyaltyStatus.availableFreeDrinks > 0 && (
                <div className="rounded-xl border border-gold-500/40 bg-gold-50 px-4 py-3 dark:bg-coffee-900">
                  <label className="flex items-center gap-2 text-sm font-semibold text-coffee-800 dark:text-cream-100">
                    <input
                      type="checkbox"
                      checked={wantRedeem}
                      onChange={(e) => setWantRedeem(e.target.checked)}
                    />
                    {t("loyalty.redeemToggle")}
                  </label>
                  {wantRedeem && (
                    <div className="mt-2">
                      <label className="mb-1 block text-xs text-coffee-500 dark:text-cream-300">
                        {t("loyalty.redeemOn")}
                      </label>
                      <select
                        value={redeemIndex}
                        onChange={(e) => setRedeemIndex(Number(e.target.value))}
                        className="w-full rounded-lg border border-coffee-300 bg-cream-50 px-3 py-2 text-sm text-coffee-900 outline-none dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                      >
                        {lines.map((line, i) => (
                          <option key={line.key} value={i}>
                            {line.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <span className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
              {t("checkout.orderType")}
            </span>
            <div className="flex gap-3">
              {(["PickUp", "Delivery"] as OrderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    orderType === type
                      ? "border-gold-500 bg-coffee-800 text-gold-400"
                      : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                  }`}
                >
                  {type === "PickUp" ? t("checkout.pickup") : t("checkout.delivery")}
                </button>
              ))}
            </div>
          </div>

          {orderType === "Delivery" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
                {t("checkout.address")}
              </label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                placeholder={t("checkout.addressPlaceholder")}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-700 dark:text-cream-200">
              {t("checkout.note")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              placeholder={t("checkout.notePlaceholder")}
            />
          </div>

          {/* 💖 Gift a Drink */}
          <div className="rounded-xl border-2 border-dashed border-crimson-400/60 bg-crimson-50/50 px-4 py-3 dark:bg-coffee-900/40">
            <label className="flex items-center gap-2 text-sm font-semibold text-coffee-800 dark:text-cream-100">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
              />
              <Gift size={15} className="text-crimson-500" />
              {t("gift.checkboxLabel")}
            </label>
            {isGift && (
              <div className="mt-3 space-y-3">
                <input
                  required
                  value={giftRecipientName}
                  onChange={(e) => setGiftRecipientName(e.target.value)}
                  placeholder={t("gift.recipientPlaceholder")}
                  className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  rows={2}
                  placeholder={t("gift.messagePlaceholder")}
                  className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 font-bold text-white shadow-md transition-transform hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              t("checkout.processing")
            ) : (
              <>
                <Sparkles size={16} />
                {t("checkout.payButton")}
              </>
            )}
          </button>
        </form>

        <div className="khmer-card h-fit rounded-2xl bg-cream-50 p-6 dark:bg-coffee-800 md:col-span-2">
          <h2 className="mb-4 font-heading text-lg text-coffee-900 dark:text-cream-50">
            {t("checkout.orderSummary")}
          </h2>
          <ul className="space-y-3">
            {lines.map((line, i) => {
              const mods = describeCustomization(line.customization, lang);
              const isRedeemed = !isGroupMode && wantRedeem && redeemIndex === i;
              return (
                <li key={line.key} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-coffee-700 dark:text-cream-200">
                      {line.contributorName && (
                        <strong className="text-clay-600 dark:text-clay-400">
                          {line.contributorName}:{" "}
                        </strong>
                      )}
                      {line.name} × {line.quantity}
                    </span>
                    <span className="font-medium text-coffee-900 dark:text-cream-50">
                      ${(line.unitPrice * line.quantity).toFixed(2)}
                    </span>
                  </div>
                  {mods.length > 0 && (
                    <p className="mt-0.5 text-xs text-coffee-400 dark:text-cream-400">
                      {mods.join(" · ")}
                    </p>
                  )}
                  {isRedeemed && (
                    <p className="mt-0.5 text-xs font-bold text-crimson-500">
                      🎁 -${line.unitPrice.toFixed(2)} {t("loyalty.freeDrinkUnlocked")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-gold-500/40 pt-4 text-base font-bold text-coffee-900 dark:text-cream-50">
            <span>{t("checkout.total")}</span>
            <span>
              $
              {(!isGroupMode && wantRedeem
                ? Math.max(0, total - lines[redeemIndex].unitPrice)
                : total
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {checkout && !isApproved && (
        <StaticPaymentModal
          orderId={checkout.orderId}
          totalAmount={checkout.totalAmount}
          onApproved={handleApproved}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}
