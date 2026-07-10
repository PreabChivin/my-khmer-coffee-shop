"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import OrderHistoryList from "@/components/OrderHistoryList";
import { tierProgress } from "@/lib/loyaltyPoints";
import type { CustomerProfileDTO } from "@/lib/types";

/** 👑 Admin drill-down: a customer's account, lifetime value, points/tier,
 *  and complete purchase history. Fetches /api/admin/customers/[id]. */
export default function CustomerHistoryModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<CustomerProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/customers/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
        return res.json();
      })
      .then((data: CustomerProfileDTO) => {
        if (!cancelled) setProfile(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const tier = profile ? tierProgress(profile.user.loyaltyPoints) : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>

        {error ? (
          <p className="py-8 text-center text-sm text-crimson-600">{error}</p>
        ) : !profile ? (
          <p className="py-8 text-center text-sm text-coffee-400 dark:text-cream-400">
            កំពុងផ្ទុក...
          </p>
        ) : (
          <>
            <div className="pr-6">
              <h3 className="font-heading text-lg text-coffee-900 dark:text-cream-50">
                👤 {profile.user.name}
              </h3>
              <p className="text-xs text-coffee-500 dark:text-cream-300">
                {profile.user.email}
                {profile.user.phone ? ` · ${profile.user.phone}` : ""}
              </p>
            </div>

            {/* LTV + points + tier snapshot */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-gold-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  LTV
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  ${profile.lifetimeValue.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-clay-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  Orders
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  {profile.orderCount}
                </p>
              </div>
              <div className="rounded-2xl bg-crimson-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  Points
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  {profile.user.loyaltyPoints.toLocaleString()}
                </p>
              </div>
            </div>
            {tier && (
              <p className="mt-2 text-center text-xs font-bold text-clay-600 dark:text-clay-400">
                {tier.current.emoji} {tier.current.name} member
              </p>
            )}

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <OrderHistoryList orders={profile.orders} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
