"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Users } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import StampCard from "@/components/StampCard";
import { customizationSurcharge } from "@/lib/customization";
import type { LoyaltyStatusResponseBody } from "@/lib/types";

const LAST_PHONE_KEY = "cafe-last-phone";

/** 🛒🐻 Left-column sidebar: live cart tracking + the customer's loyalty stamps. */
export default function HomeSidebar() {
  const { t } = useLanguage();
  const { totalItems, subtotal, openCart } = useCart();
  const { isGroupMode, state: groupState, groupId } = useGroupCart();
  const [loyalty, setLoyalty] = useState<LoyaltyStatusResponseBody | null>(null);

  useEffect(() => {
    let phone = "";
    try {
      phone = window.localStorage.getItem(LAST_PHONE_KEY) ?? "";
    } catch {
      // ignore
    }
    if (!phone) return;
    fetch(`/api/loyalty/${phone}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setLoyalty(data);
      })
      .catch(() => {
        // ignore — sidebar just shows the empty state
      });
  }, []);

  const groupItems = groupState?.items ?? [];
  const groupItemCount = groupItems.reduce((sum, item) => sum + item.quantity, 0);
  const groupSubtotal = groupItems.reduce(
    (sum, item) =>
      sum + (item.product.price + customizationSurcharge(item.customization)) * item.quantity,
    0
  );

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:w-64 lg:shrink-0">
      {/* Cart tracking */}
      <button
        type="button"
        onClick={openCart}
        className="khmer-card flex items-center gap-3 rounded-3xl bg-gradient-to-br from-clay-50 to-cream-100 p-4 text-left transition-transform hover:scale-[1.02] active:scale-95 dark:from-coffee-800 dark:to-coffee-900"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-400 text-white">
          {isGroupMode ? <Users size={18} /> : <ShoppingBag size={18} />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-clay-600 dark:text-clay-400">
            {isGroupMode ? t("group.bannerTitle") : t("cart.title")}
          </p>
          <p className="truncate text-sm font-semibold text-coffee-800 dark:text-cream-100">
            {isGroupMode
              ? `${groupItemCount} · $${groupSubtotal.toFixed(2)}`
              : `${totalItems} · $${subtotal.toFixed(2)}`}
          </p>
        </div>
      </button>

      {/* 🐻 Loyalty stamps */}
      {loyalty ? (
        <StampCard
          stampsTowardNext={loyalty.stampsTowardNext}
          availableFreeDrinks={loyalty.availableFreeDrinks}
        />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-clay-300 bg-clay-50/60 px-4 py-4 text-center dark:bg-coffee-900/40">
          <p className="text-2xl">🐻</p>
          <p className="mt-1 text-xs font-medium text-coffee-500 dark:text-cream-300">
            {t("loyalty.noAccountYet")}
          </p>
        </div>
      )}

      {groupId && (
        <p className="text-center text-[11px] text-coffee-400 dark:text-cream-400">
          {t("group.addingAs")}
        </p>
      )}
    </aside>
  );
}
