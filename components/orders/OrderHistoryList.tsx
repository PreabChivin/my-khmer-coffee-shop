"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import OrderTimeline from "@/components/orders/OrderTimeline";
import type { OrderHistoryItemDTO, OrderStatus } from "@/lib/types";

const STATUS_STYLE: Record<OrderStatus, { key: TranslationKey; cls: string }> = {
  PENDING: { key: "orderHistory.status.pending", cls: "bg-coffee-100 text-coffee-600 dark:bg-coffee-800 dark:text-cream-300" },
  AWAITING_VERIFICATION: { key: "orderHistory.status.verifying", cls: "bg-amber-100 text-amber-700" },
  PREPARING: { key: "orderHistory.status.preparing", cls: "bg-clay-100 text-clay-600" },
  READY: { key: "orderHistory.status.ready", cls: "bg-matcha-100 text-matcha-700" },
  COMPLETED: { key: "orderHistory.status.completed", cls: "bg-matcha-500 text-white" },
  CANCELLED: { key: "orderHistory.status.cancelled", cls: "bg-crimson-100 text-crimson-600" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderHistoryList({
  orders,
  emptyLabel,
}: {
  orders: OrderHistoryItemDTO[];
  emptyLabel?: string;
}) {
  const { lang, t } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-coffee-300 px-6 py-10 text-center text-sm text-coffee-500 dark:border-coffee-600 dark:text-cream-300">
        {emptyLabel ?? t("orderHistory.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = STATUS_STYLE[order.orderStatus];
        return (
          <div
            key={order.id}
            className="khmer-card rounded-2xl bg-cream-50 p-4 dark:bg-coffee-800"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-heading text-base font-extrabold tabular-nums leading-snug text-coffee-900 dark:text-cream-50">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-[11px] font-medium text-coffee-400 dark:text-cream-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${status.cls}`}>
                {t(status.key)}
              </span>
            </div>

            <ul className="mt-2 space-y-0.5 text-xs text-coffee-600 dark:text-cream-300">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.quantity}× {lang === "km" ? item.nameKh : item.nameEn}
                  </span>
                  <span className="shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-center justify-between border-t border-coffee-100 pt-2 dark:border-coffee-700">
              <span className="text-[11px] text-coffee-400 dark:text-cream-400">
                {order.orderType === "Delivery" ? t("orderHistory.delivery") : t("orderHistory.pickup")}
                {" · "}
                {order.paymentMethod ?? "KHQR"}
                {order.paymentStatus === "PAID" ? " ✅" : ""}
              </span>
              <span className="text-sm font-bold text-coffee-900 dark:text-cream-50">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>

            {/* 🚚 Expandable per-order timeline with timestamps */}
            <button
              type="button"
              onClick={() => setOpenId(openId === order.id ? null : order.id)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold text-clay-600 hover:bg-clay-50 dark:text-clay-400 dark:hover:bg-coffee-900"
            >
              {openId === order.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {openId === order.id ? t("orderHistory.hide") : t("orderHistory.viewTimeline")}
            </button>
            {openId === order.id && (
              <div className="mt-2 rounded-2xl bg-cream-100 p-3 dark:bg-coffee-900">
                <OrderTimeline
                  status={order.orderStatus}
                  orderType={order.orderType}
                  timeline={order.timeline}
                  compact
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
