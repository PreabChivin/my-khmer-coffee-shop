"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Users, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { customizationSurcharge, describeCustomization } from "@/lib/customization";
import { localizedName } from "@/lib/i18n";
import { SPIN_UNLOCK_THRESHOLD } from "@/lib/wheel";
import WheelOfCoffee from "@/components/WheelOfCoffee";
import ProductImage from "@/components/ProductImage";

export default function CartSidebar() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
    vibe,
    spinPrize,
    setSpinPrize,
  } = useCart();
  const { isGroupMode, state: groupState, updateGroupItemQuantity, removeGroupItem } =
    useGroupCart();
  const { isAdmin } = useAdminSession();
  const { lang, t } = useLanguage();

  // Strict world-separation: the cart never renders while Staff View is active.
  if (!isCartOpen || isAdmin) return null;

  const groupItems = groupState?.items ?? [];
  const groupSubtotal = groupItems.reduce((sum, item) => {
    const unitPrice = item.product.price + customizationSurcharge(item.customization);
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close cart overlay"
        onClick={closeCart}
        className="absolute inset-0 bg-coffee-900/40 backdrop-blur-sm"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-cream-50 shadow-2xl dark:bg-coffee-900">
        <div className="flex items-center justify-between border-b-2 border-gold-500/60 px-5 py-4">
          <h2 className="flex items-center gap-2 font-heading text-lg text-coffee-900 dark:text-cream-50">
            {isGroupMode ? <Users size={20} /> : <ShoppingBag size={20} />}
            {isGroupMode ? t("group.bannerTitle") : t("cart.title")}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full text-coffee-700 hover:bg-coffee-100 dark:text-cream-200 dark:hover:bg-coffee-800"
          >
            <X size={18} />
          </button>
        </div>

        {isGroupMode ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {groupItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
                  <Users size={40} className="text-coffee-300 dark:text-cream-400" />
                  <p className="text-coffee-400 dark:text-cream-400">
                    {t("group.empty")}
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {groupItems.map((item) => {
                    const name = localizedName(
                      { nameEn: item.product.nameEn, nameKh: item.product.nameKh },
                      lang
                    );
                    const mods = describeCustomization(item.customization, lang);
                    const unitPrice =
                      item.product.price + customizationSurcharge(item.customization);
                    return (
                      <li key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-coffee-100">
                          <ProductImage
                            src={item.product.image}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-coffee-900 dark:text-cream-50">
                              <span className="text-clay-500 dark:text-clay-400">
                                {item.contributorName}
                              </span>
                              {" · "}
                              {name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeGroupItem(item.id)}
                              aria-label={`${t("cart.remove")} ${name}`}
                              className="text-coffee-400 hover:text-red-500 dark:text-cream-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {mods.length > 0 && (
                            <p className="mt-0.5 text-xs leading-snug text-coffee-400 dark:text-cream-400">
                              {mods.join(" · ")}
                            </p>
                          )}
                          <p className="mt-0.5 text-sm text-coffee-500 dark:text-cream-300">
                            ${unitPrice.toFixed(2)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateGroupItemQuantity(item.id, item.quantity - 1)
                              }
                              aria-label="Decrease quantity"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-coffee-300 text-coffee-700 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-800"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold dark:text-cream-50">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateGroupItemQuantity(item.id, item.quantity + 1)
                              }
                              aria-label="Increase quantity"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-coffee-300 text-coffee-700 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-800"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {groupItems.length > 0 && (
              <div className="border-t border-coffee-200 px-5 py-4 dark:border-coffee-700">
                <div className="mb-3 flex items-center justify-between text-base font-semibold text-coffee-900 dark:text-cream-50">
                  <span>{t("cart.subtotal")}</span>
                  <span>${groupSubtotal.toFixed(2)}</span>
                </div>
                <p className="mb-2 text-center text-xs text-coffee-500 dark:text-cream-300">
                  {t("group.checkoutNote")}
                </p>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 text-center font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                >
                  {t("group.checkout")}
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 px-2 text-center">
                <ShoppingBag
                  size={40}
                  className="text-coffee-300 dark:text-cream-400"
                />
                <p className="text-coffee-400 dark:text-cream-400">
                  {t("cart.empty")}
                </p>
                <div className="w-full rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50 px-4 py-6 dark:bg-coffee-800/60">
                  <p className="text-3xl">🧸🧋</p>
                  <p className="mt-2 text-sm font-medium text-coffee-600 dark:text-cream-200">
                    {t("cart.emptyHint")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 🎡 Wheel of Coffee — unlocked once the cart passes the tier */}
                {subtotal >= SPIN_UNLOCK_THRESHOLD && (
                  <div className="mb-4 rounded-3xl border-2 border-dashed border-gold-500/60 bg-gradient-to-b from-gold-50 to-clay-50 px-4 py-5 dark:from-coffee-800 dark:to-coffee-900">
                    <p className="mb-3 text-center font-heading text-base font-extrabold text-coffee-900 dark:text-cream-50">
                      {t("wheel.title")}
                    </p>
                    <WheelOfCoffee wonPrize={spinPrize} onWin={setSpinPrize} />
                    {spinPrize && (
                      <p className="mt-3 text-center text-xs font-medium text-matcha-700">
                        {t("wheel.prizeSaved")}
                      </p>
                    )}
                  </div>
                )}

                {/* 🔮 Daily Vibe Check injected from the configurator */}
                {vibe && (
                  <div className="animate-pop-in mb-4 rounded-2xl border-2 border-dashed border-clay-400 bg-gradient-to-r from-clay-50 to-cream-100 px-4 py-3 text-center dark:from-coffee-800 dark:to-coffee-900">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-clay-600 dark:text-clay-400">
                      {lang === "km" ? "ជតារាសីថ្ងៃនេះ" : "Today's Vibe Check"} 🔮
                    </p>
                    <p className="mt-1 text-2xl">{vibe.emoji}</p>
                    <p className="text-xs font-medium leading-relaxed text-coffee-800 dark:text-cream-100">
                      {lang === "km" ? vibe.km : vibe.en}
                    </p>
                  </div>
                )}

                <ul className="space-y-4">
                  {items.map((item) => {
                    const name = lang === "km" ? item.nameKh : item.nameEn;
                    const mods = describeCustomization(item.customization, lang);
                    return (
                      <li key={item.lineId} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-coffee-100">
                          <ProductImage
                            src={item.image}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-coffee-900 dark:text-cream-50">
                              {name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(item.lineId)}
                              aria-label={`${t("cart.remove")} ${name}`}
                              className="text-coffee-400 hover:text-red-500 dark:text-cream-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {mods.length > 0 && (
                            <p className="mt-0.5 text-xs leading-snug text-coffee-400 dark:text-cream-400">
                              {mods.join(" · ")}
                            </p>
                          )}

                          <p className="mt-0.5 text-sm text-coffee-500 dark:text-cream-300">
                            ${item.price.toFixed(2)}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.lineId, item.quantity - 1)
                              }
                              aria-label="Decrease quantity"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-coffee-300 text-coffee-700 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-800"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold dark:text-cream-50">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.lineId, item.quantity + 1)
                              }
                              aria-label="Increase quantity"
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-coffee-300 text-coffee-700 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-800"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}

        {!isGroupMode && items.length > 0 && (
          <div className="border-t border-coffee-200 px-5 py-4 dark:border-coffee-700">
            <div className="mb-3 flex items-center justify-between text-base font-semibold text-coffee-900 dark:text-cream-50">
              <span>{t("cart.subtotal")}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full rounded-xl bg-gold-500 py-3 text-center font-semibold text-coffee-900 transition-colors hover:bg-gold-600"
            >
              {t("cart.checkout")}
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
