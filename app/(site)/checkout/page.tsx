"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFulfillment } from "@/contexts/FulfillmentContext";
import StaticPaymentModal from "@/components/StaticPaymentModal";
import OrderSuccess from "@/components/OrderSuccess";
import { describeCustomization } from "@/lib/customization";
import { randomFortune, type Fortune } from "@/lib/fortunes";
import type { CheckoutResponseBody, OrderType } from "@/lib/types";

interface CheckoutState {
  orderId: string;
  totalAmount: number;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const chosenFortune = randomFortune();
    setFortune(chosenFortune);

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
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            customization: item.customization,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      const result = data as CheckoutResponseBody;
      setCheckout(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleApproved() {
    setIsApproved(true);
    clearCart();
  }

  if (isApproved && checkout) {
    return (
      <OrderSuccess
        orderId={checkout.orderId}
        orderType={orderType}
        fortune={fortune}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="font-heading text-2xl text-coffee-900 dark:text-cream-50">
          {t("checkout.emptyCartTitle")}
        </h1>
        <p className="mt-2 text-coffee-500 dark:text-cream-300">
          {t("checkout.emptyCartHint")}
        </p>
        <Link
          href="/menu"
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

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-coffee-900 transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-coffee-300"
          >
            {isSubmitting ? t("checkout.processing") : t("checkout.payButton")}
          </button>
        </form>

        <div className="khmer-card h-fit rounded-2xl bg-cream-50 p-6 dark:bg-coffee-800 md:col-span-2">
          <h2 className="mb-4 font-heading text-lg text-coffee-900 dark:text-cream-50">
            {t("checkout.orderSummary")}
          </h2>
          <ul className="space-y-3">
            {items.map((item) => {
              const name = lang === "km" ? item.nameKh : item.nameEn;
              const mods = describeCustomization(item.customization, lang);
              return (
                <li key={item.lineId} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-coffee-700 dark:text-cream-200">
                      {name} × {item.quantity}
                    </span>
                    <span className="font-medium text-coffee-900 dark:text-cream-50">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  {mods.length > 0 && (
                    <p className="mt-0.5 text-xs text-coffee-400 dark:text-cream-400">
                      {mods.join(" · ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-gold-500/40 pt-4 text-base font-bold text-coffee-900 dark:text-cream-50">
            <span>{t("checkout.total")}</span>
            <span>${subtotal.toFixed(2)}</span>
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
