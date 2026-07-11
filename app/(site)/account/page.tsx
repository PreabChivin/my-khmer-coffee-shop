"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoyaltyProgress from "@/components/LoyaltyProgress";
import RewardStore from "@/components/RewardStore";
import OrderHistoryList from "@/components/OrderHistoryList";
import { generationFromDOB } from "@/lib/generation";
import type { OrderHistoryItemDTO } from "@/lib/types";

export default function AccountPage() {
  const { user, isLoading, logout } = useCustomerSession();
  const { lang, t } = useLanguage();
  const [orders, setOrders] = useState<OrderHistoryItemDTO[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/orders/mine")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
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
        <div className="animate-bounce-cute text-5xl">🔒</div>
        <h1 className="mt-3 font-heading text-2xl text-coffee-900 dark:text-cream-50">
          {t("account.lockedTitle")}
        </h1>
        <p className="mt-2 text-sm text-coffee-500 dark:text-cream-300">
          {t("account.lockedSubtitle")}
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-8 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {t("account.backHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-coffee-900 dark:text-cream-50">
            {t("account.greeting").replace("{name}", user.name)}
          </h1>
          <p className="text-sm text-coffee-500 dark:text-cream-300">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-full border border-coffee-300 px-3 py-1.5 text-xs font-bold text-coffee-500 transition-colors hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-800"
        >
          <LogOut size={13} />
          {t("account.logout")}
        </button>
      </div>

      {/* 🎂 Generation tier — fun personalized blurb from date of birth */}
      {(() => {
        const gen = generationFromDOB(user.dateOfBirth);
        return gen ? (
          <div className="mb-4 flex items-center gap-3 rounded-3xl border-2 border-clay-300 bg-clay-50 px-4 py-3 dark:border-coffee-600 dark:bg-coffee-800">
            <span className="text-3xl">{gen.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-clay-600 dark:text-clay-400">
                {lang === "km" ? gen.km : gen.label}
              </p>
              <p className="text-xs leading-relaxed text-coffee-600 dark:text-cream-200">
                {gen.slang}
              </p>
            </div>
          </div>
        ) : null;
      })()}

      {/* 💎 Loyalty points + tier progress */}
      <LoyaltyProgress points={user.loyaltyPoints} />

      {/* 🎁 Redeem Rewards store */}
      <RewardStore />

      {/* 🧾 My Orders */}
      <h2 className="mb-3 mt-8 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
        {t("account.myOrders")}
      </h2>
      {orders === null ? (
        <p className="text-sm text-coffee-400 dark:text-cream-400">{t("account.loadingOrders")}</p>
      ) : (
        <OrderHistoryList orders={orders} />
      )}
    </div>
  );
}
