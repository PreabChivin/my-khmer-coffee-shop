"use client";

import { useRouter } from "next/navigation";
import { Bike, MapPin, Search, Store } from "lucide-react";
import { useFulfillment } from "@/contexts/FulfillmentContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { OrderType } from "@/lib/types";

export default function FulfillmentBar() {
  const router = useRouter();
  const { t } = useLanguage();
  const { orderType, address, setOrderType, setAddress } = useFulfillment();

  const options: { type: OrderType; icon: typeof Bike; labelKey: "checkout.delivery" | "checkout.pickup" }[] = [
    { type: "Delivery", icon: Bike, labelKey: "checkout.delivery" },
    { type: "PickUp", icon: Store, labelKey: "checkout.pickup" },
  ];

  function handleOrderNow() {
    router.push("/menu");
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-gold-500/60 bg-cream-50 p-4 text-left shadow-2xl dark:bg-coffee-800">
      <p className="mb-3 text-center text-sm font-semibold text-coffee-700 dark:text-cream-200">
        {t("fulfillment.prompt")}
      </p>

      {/* Delivery / Pick-up segmented toggle */}
      <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-coffee-100 p-1 dark:bg-coffee-900">
        {options.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => setOrderType(option.type)}
            aria-pressed={orderType === option.type}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              orderType === option.type
                ? "bg-coffee-800 text-gold-400 shadow"
                : "text-coffee-600 hover:text-coffee-900 dark:text-cream-300 dark:hover:text-cream-50"
            }`}
          >
            <option.icon size={16} />
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {orderType === "Delivery" ? (
          <div className="relative flex-1">
            <MapPin
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"
            />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("fulfillment.addressPlaceholder")}
              className="w-full rounded-xl border border-coffee-300 bg-cream-50 py-3 pl-9 pr-4 text-sm text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-coffee-300 bg-cream-50 py-3 pl-3 pr-4 text-sm text-coffee-600 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-300">
            <Store size={16} className="text-coffee-400" />
            <span>
              {t("fulfillment.pickupAt")}{" "}
              <span className="font-semibold text-coffee-800 dark:text-cream-100">
                {t("home.address")}
              </span>
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={handleOrderNow}
          className="flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-coffee-900 transition-colors hover:bg-gold-600"
        >
          <Search size={16} />
          {t("home.orderNow")}
        </button>
      </div>
    </div>
  );
}
