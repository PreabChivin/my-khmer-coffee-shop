"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SayingBlock from "@/components/SayingBlock";
import { CULTURAL, randomSaying, type CulturalSaying } from "@/lib/i18n";
import { describeCustomization } from "@/lib/customization";

export default function CartSidebar() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
  } = useCart();
  const { lang, t } = useLanguage();

  // Rotate a random ancestral proverb each time the cart opens. Picked in an
  // effect to avoid a server/client hydration mismatch.
  const [saying, setSaying] = useState<CulturalSaying | null>(null);
  useEffect(() => {
    // Deferred to an effect (random pick) to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCartOpen) setSaying(randomSaying());
  }, [isCartOpen]);

  if (!isCartOpen) return null;

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
            <ShoppingBag size={20} /> {t("cart.title")}
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
              <div className="w-full rounded-2xl border border-gold-500/40 bg-gold-50/60 px-4 py-6 dark:bg-coffee-800/60">
                <SayingBlock saying={CULTURAL.cartEmpty} variant="dark" size="sm" />
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {items.map((item) => {
                  const name = lang === "km" ? item.nameKh : item.nameEn;
                  const mods = describeCustomization(item.customization, lang);
                  return (
                    <li key={item.lineId} className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-coffee-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
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

              {/* Rotating ancestral proverb */}
              {saying && (
                <div className="mt-6 rounded-2xl border border-gold-500/30 bg-gold-50/50 px-4 py-5 dark:bg-coffee-800/50">
                  <SayingBlock saying={saying} variant="dark" size="sm" />
                </div>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
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
