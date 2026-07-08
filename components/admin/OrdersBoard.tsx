"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bike,
  Clock,
  DollarSign,
  Gift,
  ListOrdered,
  Printer,
  Store,
  Users,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedName, type TranslationKey } from "@/lib/i18n";
import { describeCustomization } from "@/lib/customization";
import Confetti from "@/components/Confetti";
import AdminStats from "@/components/admin/AdminStats";
import ReceiptModal, {
  type ReceiptOrder,
} from "@/components/admin/ReceiptModal";
import type {
  DrinkCustomization,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types";

// Short two-tone chime generated with the Web Audio API — no external audio
// asset needed, and it works the moment a new order needs staff attention.
function playNotificationChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      const startTime = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.32);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    // Web Audio unavailable (e.g. very old browser) — fail silently
  }
}

interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { nameEn: string; nameKh: string };
  customizations?: DrinkCustomization | null;
  contributorName?: string | null;
}

interface AdminOrder {
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

const POLL_INTERVAL_MS = 3000;

const COLUMNS: { key: OrderStatus; titleKey: TranslationKey }[] = [
  { key: "PENDING", titleKey: "adminCol.pending" },
  { key: "AWAITING_VERIFICATION", titleKey: "adminCol.awaitingVerification" },
  { key: "PREPARING", titleKey: "adminCol.preparing" },
  { key: "READY", titleKey: "adminCol.ready" },
  { key: "COMPLETED", titleKey: "adminCol.completed" },
  { key: "CANCELLED", titleKey: "adminCol.cancelled" },
];

// Kitchen lifecycle: Accept & Brew advances the customer's live tracker to
// phase 2 (Brewing); Mark Ready advances it to phase 3 (Ready for Pick-Up).
const NEXT_STATUS: Partial<
  Record<OrderStatus, { labelKey: TranslationKey; next: OrderStatus }>
> = {
  PENDING: { labelKey: "adminAction.acceptBrew", next: "PREPARING" },
  AWAITING_VERIFICATION: {
    labelKey: "adminAction.acceptBrew",
    next: "PREPARING",
  },
  PREPARING: { labelKey: "adminAction.markReady", next: "READY" },
  READY: { labelKey: "adminAction.markCompleted", next: "COMPLETED" },
};

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "PREPARING",
  "READY",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersBoard() {
  const { lang, t } = useLanguage();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const knownAwaitingIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) return;
        const data: AdminOrder[] = await res.json();
        if (cancelled) return;

        const currentAwaiting = new Set(
          data
            .filter((o) => o.orderStatus === "AWAITING_VERIFICATION")
            .map((o) => o.id)
        );
        const previousAwaiting = knownAwaitingIds.current;
        const hasNewArrival =
          previousAwaiting !== null &&
          [...currentAwaiting].some((id) => !previousAwaiting.has(id));
        if (hasNewArrival) playNotificationChime();
        knownAwaitingIds.current = currentAwaiting;

        setOrders(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function patchOrder(
    orderId: string,
    body: { orderStatus?: OrderStatus; giftRedeemed?: boolean }
  ) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updated : o))
        );
        // 🎉 Celebrate the moment an order is approved into the kitchen.
        if (body.orderStatus === "PREPARING") setConfettiKey(Date.now());
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function updateStatus(orderId: string, orderStatus: OrderStatus) {
    return patchOrder(orderId, { orderStatus });
  }

  function markGiftRedeemed(orderId: string) {
    return patchOrder(orderId, { giftRedeemed: true });
  }

  const totalRevenue = orders
    .filter((o) => o.payment?.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const activeOrders = orders.filter((o) =>
    ACTIVE_STATUSES.includes(o.orderStatus)
  ).length;
  const completedOrders = orders.filter(
    (o) => o.orderStatus === "COMPLETED"
  ).length;
  const awaitingCount = orders.filter(
    (o) => o.orderStatus === "AWAITING_VERIFICATION"
  ).length;

  if (isLoading) {
    return (
      <p className="p-6 text-coffee-500 dark:text-cream-300">
        {t("adminAction.loadingOrders")}
      </p>
    );
  }

  return (
    <div className="p-6">
      {awaitingCount > 0 && (
        <div className="animate-amber-glow mb-6 flex items-center gap-3 rounded-2xl border-2 border-amber-500 bg-amber-50 px-4 py-3 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-sm font-semibold">
            {awaitingCount} — {t("adminAction.urgentBanner")}
          </p>
        </div>
      )}

      <AdminStats />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="khmer-card flex items-center gap-3 rounded-2xl bg-cream-50 p-4 dark:bg-coffee-800">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 text-gold-700 dark:bg-coffee-900 dark:text-gold-400">
            <DollarSign size={20} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("adminMetrics.totalRevenue")}
            </p>
            <p className="text-xl font-bold text-coffee-900 dark:text-cream-50">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="khmer-card flex items-center gap-3 rounded-2xl bg-cream-50 p-4 dark:bg-coffee-800">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-100 text-clay-500 dark:bg-coffee-900 dark:text-clay-400">
            <ListOrdered size={20} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("adminMetrics.activeOrders")}
            </p>
            <p className="text-xl font-bold text-coffee-900 dark:text-cream-50">
              {activeOrders}
            </p>
          </div>
        </div>

        <div className="khmer-card flex items-center gap-3 rounded-2xl bg-cream-50 p-4 dark:bg-coffee-800">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coffee-200 text-coffee-700 dark:bg-coffee-900 dark:text-cream-200">
            <Store size={20} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-coffee-400 dark:text-cream-400">
              {t("adminMetrics.completed")}
            </p>
            <p className="text-xl font-bold text-coffee-900 dark:text-cream-50">
              {completedOrders}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter(
            (o) => o.orderStatus === column.key
          );
          const isUrgentColumn = column.key === "AWAITING_VERIFICATION";
          return (
            <div
              key={column.key}
              className={`flex flex-col rounded-2xl p-3 ${
                isUrgentColumn && columnOrders.length > 0
                  ? "bg-amber-100 dark:bg-amber-950"
                  : "bg-coffee-100/60 dark:bg-coffee-800/60"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3
                  className={`text-sm font-bold uppercase tracking-wide ${
                    isUrgentColumn
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-coffee-700 dark:text-cream-200"
                  }`}
                >
                  {t(column.titleKey)}
                </h3>
                <span className="rounded-full bg-cream-50 px-2 py-0.5 text-xs font-semibold text-coffee-600 dark:bg-coffee-900 dark:text-cream-200">
                  {columnOrders.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {columnOrders.length === 0 && (
                  <p className="px-2 text-xs text-coffee-400 dark:text-cream-400">
                    {t("adminCol.noOrders")}
                  </p>
                )}

                {columnOrders.map((order) => {
                  const action = NEXT_STATUS[order.orderStatus];
                  const isUrgent = order.orderStatus === "AWAITING_VERIFICATION";
                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border bg-cream-50 p-3 shadow-sm dark:bg-coffee-900 ${
                        isUrgent
                          ? "animate-amber-glow border-amber-500"
                          : "border-coffee-200 dark:border-coffee-700"
                      }`}
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

                      <p className="text-sm font-medium text-coffee-800 dark:text-cream-100">
                        {order.customerName}
                      </p>
                      {order.isGift && order.giftRecipientName && (
                        <p className="text-xs text-crimson-500 dark:text-crimson-400">
                          → {order.giftRecipientName}
                        </p>
                      )}
                      <p className="text-xs text-coffee-500 dark:text-cream-300">
                        {order.customerPhone}
                      </p>

                      <div className="mt-2 flex items-center gap-1 text-xs text-coffee-600 dark:text-cream-300">
                        {order.orderType === "Delivery" ? (
                          <Bike size={12} />
                        ) : (
                          <Store size={12} />
                        )}
                        {order.orderType === "Delivery"
                          ? t("checkout.delivery")
                          : t("checkout.pickup")}
                        {order.address ? ` · ${order.address}` : ""}
                      </div>

                      <ul className="mt-2 space-y-1 text-xs text-coffee-600 dark:text-cream-300">
                        {order.items.map((item) => {
                          const mods = describeCustomization(
                            item.customizations ?? null,
                            lang
                          );
                          return (
                            <li key={item.id}>
                              <span>
                                {item.contributorName && (
                                  <strong className="text-clay-600 dark:text-clay-400">
                                    {item.contributorName}:{" "}
                                  </strong>
                                )}
                                {item.quantity}×{" "}
                                {localizedName(item.product, lang)}
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

                      {action && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => updateStatus(order.id, action.next)}
                          className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                            isUrgent
                              ? "bg-amber-600 text-cream-50 hover:bg-amber-700"
                              : "bg-gold-500 text-coffee-900 hover:bg-gold-600"
                          }`}
                        >
                          {t(action.labelKey)}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gold-500/60 py-1.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-50 dark:text-gold-400 dark:hover:bg-coffee-800"
                      >
                        <Printer size={13} />
                        {t("adminAction.printReceipt")}
                      </button>

                      {order.isGift && !order.giftRedeemed && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => markGiftRedeemed(order.id)}
                          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-crimson-500 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-crimson-600 disabled:opacity-60"
                        >
                          <Gift size={13} />
                          {t("adminAction.markGiftRedeemed")}
                        </button>
                      )}

                      {ACTIVE_STATUSES.includes(order.orderStatus) && (
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => updateStatus(order.id, "CANCELLED")}
                          className="mt-1.5 w-full rounded-lg border border-coffee-300 py-1.5 text-xs font-semibold text-coffee-500 transition-colors hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-800"
                        >
                          {t("adminAction.cancelOrder")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {confettiKey > 0 && <Confetti key={confettiKey} />}
    </div>
  );
}
