"use client";

import Link from "next/link";
import { Coffee, Crown, LogOut, ShoppingCart, Truck, User, Users } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getOrCreateTelegramSessionToken } from "@/lib/telegramSession";
import { openTelegramBot } from "@/lib/openExternal";
import AppearanceSettings from "@/components/AppearanceSettings";
import NotificationBell from "@/components/NotificationBell";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export default function Header() {
  const { totalItems, openCart } = useCart();
  const { isGroupMode, state: groupState } = useGroupCart();
  const { user, isStaff, isLoading, logout } = useSession();
  const { openAuth } = useAuthModal();
  const groupItemCount =
    groupState?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const badgeCount = isGroupMode ? groupItemCount : totalItems;
  const { t } = useLanguage();

  // 🔔 Connect this browser to the Telegram bot (device-session token). Opened
  // synchronously in the click handler — a real user gesture, so it isn't
  // popup-blocked. openExternalUrl keeps the new-tab behavior on web but
  // navigates same-frame inside the Capacitor app (where window.open "_blank"
  // is swallowed) so the Telegram deep link still launches. From then on,
  // every order placed on this device is auto-notified on status changes.
  function handleConnectTelegram() {
    if (!TELEGRAM_BOT_USERNAME) return;
    const token = getOrCreateTelegramSessionToken();
    openTelegramBot(TELEGRAM_BOT_USERNAME, `s_${token}`);
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
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-coffee-500 dark:text-cream-300 sm:block">
              BenChimin Cafe
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* 🔐 Staff badge — replaces the old floating StaffPortalButton.
              Only ever shown once a STAFF/ADMIN session is confirmed. */}
          {!isLoading && isStaff && (
            <div className="flex animate-pulse items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-matcha-300 to-matcha-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(127,209,174,0.8)]">
              <Crown size={12} />
              🧑‍🍳 បុគ្គលិកហាងកាហ្វេ: Active {user?.name}
              <span className="mx-0.5 opacity-60">|</span>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 underline decoration-dotted underline-offset-2"
              >
                <LogOut size={11} />
                ចុចចេញ/Logout
              </button>
            </div>
          )}

          {/* 🔔 Connect Telegram anytime — links this device so future orders
              get live status DMs. Hidden for staff and until the bot is set. */}
          {!isStaff && TELEGRAM_BOT_USERNAME && (
            <button
              type="button"
              onClick={handleConnectTelegram}
              aria-label="🔔 ទទួលដំណឹងតាម Telegram"
              className="hidden items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-lavender-400 to-clay-400 p-2 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 sm:flex sm:px-3 sm:py-1.5"
            >
              <span className="md:hidden">🔔</span>
              <span className="hidden md:inline">🔔 ទទួលដំណឹងតាម Telegram</span>
            </button>
          )}

          <AppearanceSettings />

          {/* 👤 Customer account — logged out opens the auth modal; logged in
              shows a points pill linking to My Orders. Hidden for staff. */}
          {!isStaff &&
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

          {/* 🔔 In-app notifications (live order-status alerts + promos) */}
          {!isStaff && <NotificationBell />}

          {/* 🚚 Order tracking — jumps to the live tracking dashboard */}
          {!isStaff && (
            <Link
              href="/orders"
              aria-label="តាមដានការកុម្ម៉ង់"
              title="តាមដានការកុម្ម៉ង់"
              className="group relative flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-transform hover:scale-110 hover:bg-coffee-100 active:scale-95 dark:text-cream-100 dark:hover:bg-coffee-800"
            >
              <Truck size={20} />
              {/* Hover tooltip */}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-coffee-900 px-2 py-1 text-[10px] font-semibold text-cream-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-cream-50 dark:text-coffee-900">
                តាមដានការកុម្ម៉ង់
              </span>
            </Link>
          )}

          {!isStaff && (
            <button
              type="button"
              onClick={openCart}
              aria-label={t("cart.openAria")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-transform hover:scale-110 hover:bg-coffee-100 active:scale-95 dark:text-cream-100 dark:hover:bg-coffee-800"
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
