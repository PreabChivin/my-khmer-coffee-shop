"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import OrderHistoryList from "@/components/OrderHistoryList";
import type { OrderHistoryItemDTO } from "@/lib/types";

// 🚚 Dedicated Order History / Live Tracking dashboard (linked from the header
// truck icon). Auth-gated: prompts sign-in for guests.
export default function OrdersPage() {
  const { user, isLoading } = useSession();
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderHistoryItemDTO[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/orders/mine");
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setOrders(data);
      } catch {
        if (!cancelled) setOrders([]);
      }
    };
    load();
    // Light polling so statuses stay live while the page is open.
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <p className="text-coffee-400 dark:text-cream-400">{t("account.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="animate-bounce-cute text-5xl">🚚</div>
        <h1 className="mt-3 font-heading text-2xl text-coffee-900 dark:text-cream-50">
          {t("ordersPage.lockedTitle")}
        </h1>
        <p className="mt-2 text-sm text-coffee-500 dark:text-cream-300">
          {t("ordersPage.lockedSubtitle")}
        </p>
        <button
          type="button"
          onClick={openAuth}
          className="mt-6 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-8 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {t("notif.loginBtn")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-clay-400 to-crimson-400 text-white shadow">
          <Truck size={22} />
        </span>
        <div>
          <h1 className="font-heading text-2xl text-coffee-900 dark:text-cream-50">
            {t("ordersPage.title")}
          </h1>
          <p className="text-sm text-coffee-500 dark:text-cream-300">
            {t("ordersPage.subtitle")}
          </p>
        </div>
      </div>

      {orders === null ? (
        <p className="text-sm text-coffee-400 dark:text-cream-400">{t("account.loadingOrders")}</p>
      ) : (
        <OrderHistoryList orders={orders} />
      )}

      <div className="mt-6 text-center">
        <Link
          href="/account"
          className="text-xs font-semibold text-clay-600 underline decoration-dotted dark:text-clay-400"
        >
          {t("ordersPage.viewPoints")}
        </Link>
      </div>
    </div>
  );
}
