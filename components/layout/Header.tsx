"use client";

import Link from "next/link";
import { Crown, Gamepad2, LogOut, MessageCircle, Sparkles, Trophy, User } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { getOrCreateTelegramSessionToken } from "@/lib/telegramSession";
import { openTelegramBot } from "@/lib/openExternal";
import AppearanceSettings from "@/components/layout/AppearanceSettings";
import NotificationBell from "@/components/layout/NotificationBell";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

function NavIconLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-transform hover:scale-110 hover:bg-coffee-100 active:scale-95 dark:text-cream-100 dark:hover:bg-coffee-800"
    >
      {icon}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-coffee-900 px-2 py-1 text-[10px] font-semibold text-cream-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-cream-50 dark:text-coffee-900">
        {label}
      </span>
    </Link>
  );
}

export default function Header() {
  const { user, isStaff, isLoading, logout } = useSession();
  const { openAuth } = useAuthModal();

  // 🔔 Connect this browser to the Telegram bot (device-session token). Opened
  // synchronously in the click handler — a real user gesture, so it isn't
  // popup-blocked. openExternalUrl keeps the new-tab behavior on web but
  // navigates same-frame inside the Capacitor app (where window.open "_blank"
  // is swallowed) so the Telegram deep link still launches.
  function handleConnectTelegram() {
    if (!TELEGRAM_BOT_USERNAME) return;
    const token = getOrCreateTelegramSessionToken();
    openTelegramBot(TELEGRAM_BOT_USERNAME, `s_${token}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold-500/70 bg-cream-50/90 shadow-[0_1px_24px_-8px_rgba(255,195,46,0.35)] backdrop-blur-xl backdrop-saturate-150 dark:bg-coffee-900/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="btn-tactile flex items-center gap-2 text-coffee-900 dark:text-cream-50"
        >
          <span className="glow-ring flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
            <Gamepad2 size={20} />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg">បេនជីមីន អាកែត</span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-coffee-500 dark:text-cream-300 sm:block">
              BENCHIMIN ARCADE
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* 🔐 Staff badge — only ever shown once a STAFF/ADMIN session is
              confirmed. Doubles as the return path to the admin dashboard. */}
          {!isLoading && isStaff && (
            <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-matcha-300 to-matcha-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(127,209,174,0.8)]">
              <Link
                href="/admin"
                title="ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង · Back to Dashboard"
                className="flex items-center gap-1.5 underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-80"
              >
                <Crown size={12} />
                🕹️ បុគ្គលិក: Active {user?.name}
              </Link>
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

          {/* 🎮🏆👗 Arcade nav — Game Arena is the "/" logo itself. */}
          {!isStaff && (
            <>
              <NavIconLink href="/leaderboard" label="តារាងចំណាត់ថ្នាក់ · Leaderboard" icon={<Trophy size={19} />} />
              <NavIconLink href="/avatar-studio" label="ស្ទូឌីយោអវតារ · Avatar Studio" icon={<Sparkles size={19} />} />
              <NavIconLink href="/social" label="Social Lounge" icon={<MessageCircle size={19} />} />
            </>
          )}

          {/* 🔔 Connect Telegram anytime — links this device so game invites
              and account alerts get live DMs. Hidden for staff and until the
              bot is set. */}
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

          {/* 👤 Player account — logged out opens the auth modal; logged in
              shows an Arcade Points pill. Hidden for staff. */}
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

          {/* 🔔 In-app notifications */}
          {!isStaff && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}
