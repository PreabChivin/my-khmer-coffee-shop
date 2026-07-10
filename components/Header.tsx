"use client";

import Link from "next/link";
import { Coffee, ShoppingCart, User, Users } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOrCreateTelegramSessionToken } from "@/lib/telegramSession";
import LanguageToggle from "@/components/LanguageToggle";
import AppearanceSettings from "@/components/AppearanceSettings";
import StaffPortalButton from "@/components/StaffPortalButton";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Header() {
  const { totalItems, openCart } = useCart();
  const { isGroupMode, state: groupState } = useGroupCart();
  const { isAdmin } = useAdminSession();
  const { user } = useCustomerSession();
  const { openAuth } = useAuthModal();
  const groupItemCount =
    groupState?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const badgeCount = isGroupMode ? groupItemCount : totalItems;
  const { t } = useLanguage();

  // 🔔 Connect this browser to the Telegram bot (device-session token). Opened
  // synchronously in the click handler — a real user gesture, so it isn't
  // popup-blocked. From then on, every order placed on this device is
  // auto-notified on status changes, no phone number needed.
  function handleConnectTelegram() {
    const token = getOrCreateTelegramSessionToken();
    window.open(
      `https://t.me/${TELEGRAM_BOT_USERNAME}?start=s_${token}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

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

          {/* 🔔 Connect Telegram anytime — links this device so future orders
              get live status DMs. Hidden for staff and until the bot is set. */}
          {!isAdmin && TELEGRAM_BOT_USERNAME && (
            <button
              type="button"
              onClick={handleConnectTelegram}
              aria-label="🔔 ទទួលដំណឹងតាម Telegram"
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-lavender-400 to-clay-400 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            >
              <span className="md:hidden">🔔</span>
              <span className="hidden md:inline">🔔 ទទួលដំណឹងតាម Telegram</span>
            </button>
          )}

          <LanguageToggle />
          <AppearanceSettings />

          {/* 👤 Customer account — logged out opens the auth modal; logged in
              shows a points pill linking to My Orders. Hidden for staff. */}
          {!isAdmin &&
            (user ? (
              <Link
                href="/account"
                aria-label="My account"
                className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-gold-400 to-clay-400 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <User size={13} />
                {user.loyaltyPoints.toLocaleString()} 💎
              </Link>
            ) : (
              <button
                type="button"
                onClick={openAuth}
                aria-label="Sign in"
                className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-colors hover:bg-coffee-100 dark:text-cream-100 dark:hover:bg-coffee-800"
              >
                <User size={20} />
              </button>
            ))}

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
    </header>
  );
}
