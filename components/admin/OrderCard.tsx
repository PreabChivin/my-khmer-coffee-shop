"use client";

import { Bike, Clock, Gift, Printer, Store, Users } from "lucide-react";
import { localizedName, type Lang, type TranslationKey } from "@/lib/i18n";
import { describeCustomization } from "@/lib/customization";
import QrZoomThumbnail from "@/components/admin/QrZoomThumbnail";
import type { DrinkCustomization, OrderStatus, PaymentStatus } from "@/lib/types";

export interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { nameEn: string; nameKh: string };
  customizations?: DrinkCustomization | null;
  contributorName?: string | null;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  address: string | null;
  note: string | null;
  createdAt: string;
  items: AdminOrderItem[];
  payment: { paymentStatus: PaymentStatus } | null;
  isGift: boolean;
  giftRecipientName: string | null;
  giftRedeemed: boolean;
  isGroupOrder: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "PREPARING",
  "READY",
];

export default function OrderCard({
  order,
  lang,
  t,
  isUpdating,
  onAdvance,
  onCancel,
  onMarkGiftRedeemed,
  onPrintReceipt,
}: {
  order: AdminOrder;
  lang: Lang;
  t: (key: TranslationKey) => string;
  isUpdating: boolean;
  onAdvance: (order: AdminOrder) => void;
  onCancel: (order: AdminOrder) => void;
  onMarkGiftRedeemed: (order: AdminOrder) => void;
  onPrintReceipt: (order: AdminOrder) => void;
}) {
  const isAwaitingVerification = order.orderStatus === "AWAITING_VERIFICATION";
  const isPending = order.orderStatus === "PENDING" || isAwaitingVerification;
  const isReady = order.orderStatus === "READY";

  // 🚨 High-priority alert states: soft pulsing red for anything still
  // waiting on staff action, bright green glow the instant it's ready.
  const cardTone = isPending
    ? "animate-amber-glow border-crimson-400"
    : isReady
      ? "border-matcha-500 shadow-[0_0_0_1px_rgba(127,209,174,0.6)]"
      : "border-coffee-200 dark:border-coffee-700";

  return (
    <div
      className={`rounded-xl border-2 bg-cream-50 p-3 shadow-sm dark:bg-coffee-900 ${cardTone}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-bold text-coffee-900 dark:text-cream-50">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <span className="flex items-center gap-1 text-xs text-coffee-400 dark:text-cream-400">
          <Clock size={12} />
          {formatTime(order.createdAt)}
        </span>
      </div>

      {(order.isGift || order.isGroupOrder) && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {order.isGift && (
            <span className="inline-flex items-center gap-1 rounded-full bg-crimson-100 px-2 py-0.5 text-[10px] font-bold text-crimson-600 dark:bg-coffee-800 dark:text-crimson-400">
              <Gift size={10} />
              {t("adminOrder.giftBadge")}
            </span>
          )}
          {order.isGroupOrder && (
            <span className="inline-flex items-center gap-1 rounded-full bg-matcha-100 px-2 py-0.5 text-[10px] font-bold text-matcha-700">
              <Users size={10} />
              {t("adminOrder.groupBadge")}
            </span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-coffee-800 dark:text-cream-100">
            {order.customerName}
          </p>
          {order.isGift && order.giftRecipientName && (
            <p className="truncate text-xs text-crimson-500 dark:text-crimson-400">
              → {order.giftRecipientName}
            </p>
          )}
          <p className="text-xs text-coffee-500 dark:text-cream-300">
            {order.customerPhone}
          </p>
        </div>
        {/* 🔍 Zoomable shop QR — the exact code this customer was shown */}
        <QrZoomThumbnail />
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs text-coffee-600 dark:text-cream-300">
        {order.orderType === "Delivery" ? <Bike size={12} /> : <Store size={12} />}
        {order.orderType === "Delivery" ? t("checkout.delivery") : t("checkout.pickup")}
        {order.address ? ` · ${order.address}` : ""}
      </div>

      {/* 🎨 Dynamic customization text per line */}
      <ul className="mt-2 space-y-1 text-xs text-coffee-600 dark:text-cream-300">
        {order.items.map((item) => {
          const mods = describeCustomization(item.customizations ?? null, lang);
          return (
            <li key={item.id}>
              <span>
                {item.contributorName && (
                  <strong className="text-clay-600 dark:text-clay-400">
                    {item.contributorName}:{" "}
                  </strong>
                )}
                {item.quantity}× {localizedName(item.product, lang)}
              </span>
              {mods.length > 0 && (
                <span className="block pl-4 text-[11px] text-clay-500 dark:text-clay-400">
                  {mods.join(" · ")}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {order.note && (
        <p className="mt-2 rounded-lg bg-coffee-50 px-2 py-1 text-xs italic text-coffee-500 dark:bg-coffee-800 dark:text-cream-300">
          &ldquo;{order.note}&rdquo;
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="font-bold text-coffee-900 dark:text-cream-50">
          ${order.totalAmount.toFixed(2)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            order.payment?.paymentStatus === "PAID"
              ? "bg-gold-100 text-gold-700 dark:bg-coffee-800 dark:text-gold-400"
              : "bg-coffee-100 text-coffee-500 dark:bg-coffee-800 dark:text-cream-300"
          }`}
        >
          {t(
            order.payment?.paymentStatus === "PAID"
              ? "paymentStatus.PAID"
              : "paymentStatus.UNPAID"
          )}
        </span>
      </div>

      {/* Prominent colored primary action — one per lifecycle stage */}
      {order.orderStatus === "PENDING" || order.orderStatus === "AWAITING_VERIFICATION" ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onAdvance(order)}
          className="mt-3 w-full rounded-lg bg-gold-500 py-2 text-xs font-bold text-coffee-900 shadow transition-transform hover:scale-[1.02] hover:bg-gold-600 active:scale-95 disabled:opacity-60"
        >
          👩‍កាត់លុយ/Approve
        </button>
      ) : order.orderStatus === "PREPARING" ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onAdvance(order)}
          className="mt-3 w-full rounded-lg bg-clay-400 py-2 text-xs font-bold text-white shadow transition-transform hover:scale-[1.02] hover:bg-clay-500 active:scale-95 disabled:opacity-60"
        >
          ☕ ឆុងរួចរាល់/Ready
        </button>
      ) : order.orderStatus === "READY" ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onAdvance(order)}
          className="mt-3 w-full rounded-lg bg-matcha-500 py-2 text-xs font-bold text-white shadow transition-transform hover:scale-[1.02] hover:bg-matcha-600 active:scale-95 disabled:opacity-60"
        >
          ✅ ជោគជ័យ
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onPrintReceipt(order)}
        className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold-500/60 py-1.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-50 dark:text-gold-400 dark:hover:bg-coffee-800"
      >
        <Printer size={13} />
        {t("adminAction.printReceipt")}
      </button>

      {order.isGift && !order.giftRedeemed && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onMarkGiftRedeemed(order)}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-crimson-500 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-crimson-600 disabled:opacity-60"
        >
          <Gift size={13} />
          {t("adminAction.markGiftRedeemed")}
        </button>
      )}

      {ACTIVE_STATUSES.includes(order.orderStatus) && (
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onCancel(order)}
          className="mt-1.5 w-full rounded-lg border-2 border-crimson-300 py-1.5 text-xs font-semibold text-crimson-600 transition-colors hover:bg-crimson-50 disabled:opacity-60 dark:border-crimson-700 dark:text-crimson-400 dark:hover:bg-coffee-800"
        >
          ❌ បោះបង់
        </button>
      )}
    </div>
  );
}
