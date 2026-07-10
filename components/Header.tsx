"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Coffee, ShoppingCart, Users } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import AppearanceSettings from "@/components/AppearanceSettings";
import StaffPortalButton from "@/components/StaffPortalButton";
import TelegramLinkModal from "@/components/TelegramLinkModal";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Header() {
  const { totalItems, openCart } = useCart();
  const { isGroupMode, state: groupState } = useGroupCart();
  const { isAdmin } = useAdminSession();
  const groupItemCount =
    groupState?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const badgeCount = isGroupMode ? groupItemCount : totalItems;
  const { t } = useLanguage();
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold-500/70 bg-cream-50/95 backdrop-blur dark:bg-coffee-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-coffee-900 dark:text-cream-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
            <Coffee size={20} />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg">បេនជីមីន កាហ្វេ</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-coffee-500 dark:text-cream-300">
              BenChimin Cafe
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <StaffPortalButton />
          <LanguageToggle />
          <AppearanceSettings />

          {/* 🔔 Pre-order Telegram linking — opt in before ever checking out */}
          {!isAdmin && TELEGRAM_BOT_USERNAME && (
            <button
              type="button"
              onClick={() => setShowTelegramModal(true)}
              aria-label="🔔 ទទួលដំណឹងតាម Telegram"
              className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-colors hover:bg-coffee-100 dark:text-cream-100 dark:hover:bg-coffee-800"
            >
              <Bell size={20} />
            </button>
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={openCart}
              aria-label={t("cart.openAria")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-colors hover:bg-coffee-100 dark:text-cream-100 dark:hover:bg-coffee-800"
            >
              {isGroupMode ? <Users size={20} /> : <ShoppingCart size={20} />}
              {badgeCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-clay-400 text-[11px] font-bold text-white">
                  {badgeCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {showTelegramModal && (
        <TelegramLinkModal onClose={() => setShowTelegramModal(false)} />
      )}
    </header>
  );
}
