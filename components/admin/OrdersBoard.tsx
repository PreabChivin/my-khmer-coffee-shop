"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Confetti from "@/components/Confetti";
import OrderCard, { type AdminOrder } from "@/components/admin/OrderCard";
import ReceiptModal, { type ReceiptOrder } from "@/components/admin/ReceiptModal";
import CustomerHistoryModal from "@/components/admin/CustomerHistoryModal";
import type { OrderStatus } from "@/lib/types";

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

const POLL_INTERVAL_MS = 3000;

// 👀☕🛵 The 3 live processing stacks staff actually work from moment to
// moment. AWAITING_VERIFICATION folds into "Pending" (it's still a pending
// staff action — approving it) but keeps its own urgent pulse styling.
const STACKS: {
  key: string;
  emoji: string;
  title: string;
  statuses: OrderStatus[];
}[] = [
  {
    key: "pending",
    emoji: "👀",
    title: "កំពុងរង់ចាំ Pending",
    statuses: ["PENDING", "AWAITING_VERIFICATION"],
  },
  {
    key: "preparing",
    emoji: "☕",
    title: "កំពុងឆុង Preparing",
    statuses: ["PREPARING"],
  },
  {
    key: "ready",
    emoji: "🛵",
    title: "ត្រៀមរួច Ready",
    statuses: ["READY"],
  },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "AWAITING_VERIFICATION",
  "PREPARING",
  "READY",
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PREPARING",
  AWAITING_VERIFICATION: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};

export default function OrdersBoard({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const knownAwaitingIds = useRef<Set<string> | null>(null);
  // Tracks whether we've ever successfully loaded orders, so a transient
  // failure on a later background poll doesn't wrongly claim the initial
  // load itself failed (this ref survives across every poll tick).
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) {
          if (!cancelled && !hasLoadedOnce.current) {
            onError("Couldn't load orders — the database may be busy.");
          }
          return;
        }
        const data: AdminOrder[] = await res.json();
        if (cancelled) return;

        const currentAwaiting = new Set(
          data.filter((o) => o.orderStatus === "AWAITING_VERIFICATION").map((o) => o.id)
        );
        const previousAwaiting = knownAwaitingIds.current;
        const hasNewArrival =
          previousAwaiting !== null &&
          [...currentAwaiting].some((id) => !previousAwaiting.has(id));
        if (hasNewArrival) playNotificationChime();
        knownAwaitingIds.current = currentAwaiting;

        hasLoadedOnce.current = true;
        setOrders(data);
      } catch {
        // transient network hiccup — the next poll tick retries silently
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⚡ Optimistic mutation: the local list updates the instant staff click an
  // action, before the network round-trip resolves. If the server rejects
  // it (validation, DB lock, etc.) the optimistic change is rolled back and
  // a toast explains what happened — never a silent stuck UI.
  async function patchOrder(
    order: AdminOrder,
    body: { orderStatus?: OrderStatus; giftRedeemed?: boolean }
  ) {
    const previousOrders = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, ...body } : o))
    );
    setUpdatingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setOrders(previousOrders);
        const data = await res.json().catch(() => null);
        onError(data?.error ?? "Couldn't update that order — please try again.");
        return;
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      if (body.orderStatus === "PREPARING") setConfettiKey(Date.now());
    } catch {
      setOrders(previousOrders);
      onError("Network error — please check your connection and try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleAdvance(order: AdminOrder) {
    const next = NEXT_STATUS[order.orderStatus];
    if (!next) return;
    void patchOrder(order, { orderStatus: next });
  }

  function handleCancel(order: AdminOrder) {
    void patchOrder(order, { orderStatus: "CANCELLED" });
  }

  function handleMarkGiftRedeemed(order: AdminOrder) {
    void patchOrder(order, { giftRedeemed: true });
  }

  const awaitingCount = orders.filter(
    (o) => o.orderStatus === "AWAITING_VERIFICATION"
  ).length;
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)).length;
  const historyOrders = orders.filter(
    (o) => o.orderStatus === "COMPLETED" || o.orderStatus === "CANCELLED"
  );

  if (isLoading) {
    return (
      <p className="p-4 text-coffee-500 dark:text-cream-300">
        {t("adminAction.loadingOrders")}
      </p>
    );
  }

  return (
    <div className="khmer-card rounded-2xl bg-cream-50/60 p-4 dark:bg-coffee-800/40">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          តំបន់បញ្ជាការកុម្ម៉ង់ 🛎️
        </h2>
        <span className="rounded-full bg-coffee-100 px-2.5 py-1 text-xs font-bold text-coffee-600 dark:bg-coffee-900 dark:text-cream-200">
          {activeCount} active
        </span>
      </div>

      {awaitingCount > 0 && (
        <div className="animate-amber-glow mb-3 flex items-center gap-2 rounded-xl border-2 border-crimson-400 bg-crimson-50 px-3 py-2 text-crimson-700 dark:bg-coffee-950 dark:text-crimson-300">
          <AlertTriangle size={16} className="shrink-0" />
          <p className="text-xs font-semibold">
            {awaitingCount} — {t("adminAction.urgentBanner")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STACKS.map((stack) => {
          const stackOrders = orders.filter((o) => stack.statuses.includes(o.orderStatus));
          return (
            <div
              key={stack.key}
              className="flex flex-col rounded-xl bg-coffee-100/60 p-2.5 dark:bg-coffee-900/60"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-coffee-700 dark:text-cream-200">
                  <span>{stack.emoji}</span>
                  {stack.title}
                </h3>
                <span className="rounded-full bg-cream-50 px-2 py-0.5 text-[11px] font-semibold text-coffee-600 dark:bg-coffee-800 dark:text-cream-200">
                  {stackOrders.length}
                </span>
              </div>

              {/* Compact, independently-scrollable stack — keeps the whole
                  dashboard from growing tall as orders pile up. */}
              <div className="flex max-h-[65vh] flex-col gap-2.5 overflow-y-auto pr-0.5">
                {stackOrders.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-coffee-400 dark:text-cream-400">
                    {t("adminCol.noOrders")}
                  </p>
                )}
                {stackOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    lang={lang}
                    t={t}
                    isUpdating={updatingId === order.id}
                    onAdvance={handleAdvance}
                    onCancel={handleCancel}
                    onMarkGiftRedeemed={handleMarkGiftRedeemed}
                    onPrintReceipt={setReceiptOrder}
                    onViewCustomer={setCustomerId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsed by default — completed/cancelled history stays out of the
          way of the live workflow but is one click from view. */}
      <button
        type="button"
        onClick={() => setShowHistory((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-coffee-200 py-2 text-xs font-semibold text-coffee-500 hover:bg-coffee-100 dark:border-coffee-700 dark:text-cream-300 dark:hover:bg-coffee-800"
      >
        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {t("adminCol.completed")} / {t("adminCol.cancelled")} ({historyOrders.length})
      </button>

      {showHistory && (
        <div className="mt-2 flex max-h-[50vh] flex-col gap-2 overflow-y-auto rounded-xl bg-coffee-100/40 p-2 dark:bg-coffee-900/40">
          {historyOrders.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-coffee-400 dark:text-cream-400">
              {t("adminCol.noOrders")}
            </p>
          )}
          {historyOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2 text-xs dark:bg-coffee-800"
            >
              <div>
                <span className="font-bold text-coffee-800 dark:text-cream-100">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>{" "}
                <span className="text-coffee-500 dark:text-cream-300">
                  {order.customerName}
                </span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    order.orderStatus === "COMPLETED"
                      ? "bg-matcha-100 text-matcha-700"
                      : "bg-coffee-200 text-coffee-600 dark:bg-coffee-700 dark:text-cream-300"
                  }`}
                >
                  {order.orderStatus === "COMPLETED"
                    ? t("adminCol.completed")
                    : t("adminCol.cancelled")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptOrder(order)}
                className="font-semibold text-gold-700 underline decoration-dotted dark:text-gold-400"
              >
                {t("adminAction.printReceipt")}
              </button>
            </div>
          ))}
        </div>
      )}

      {receiptOrder && (
        <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}

      {customerId && (
        <CustomerHistoryModal userId={customerId} onClose={() => setCustomerId(null)} />
      )}

      {confettiKey > 0 && <Confetti key={confettiKey} />}
    </div>
  );
}
