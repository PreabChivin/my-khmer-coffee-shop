"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import RegisteredCustomersPanel from "@/components/admin/RegisteredCustomersPanel";
import NotificationsPanel from "@/components/admin/NotificationsPanel";
import TelegramSubscribersPanel from "@/components/admin/TelegramSubscribersPanel";
import AdminChatMonitorPanel from "@/components/admin/AdminChatMonitorPanel";
import AdminToast from "@/components/admin/AdminToast";

/**
 * 🕹️ ផ្ទាំងគ្រប់គ្រង Social/Arcade — the single unified Staff View for the
 * gaming platform: player roster, chat moderation, notifications, and
 * Telegram connection status. The old order/product/reward-fulfilment
 * panels (POS management for the cafe's ordering business) are gone along
 * with the ordering system itself.
 */
export default function StaffKitchenView({ isAdminRole }: { isAdminRole: boolean }) {
  // 🚨 One shared error toast for the whole dashboard — any failed mutation
  // in either panel surfaces here instead of freezing or failing silently.
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showError = useCallback((message: string) => setToastMessage(message), []);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-coffee-900">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6">
        {/* 🏠 Dashboard title + a clear escape hatch back to the arcade.
            Navigating away is a plain client-side <Link> — the STAFF/ADMIN
            session cookie is untouched, so they can flip back and forth
            freely. */}
        <div className="relative flex flex-col items-center gap-3">
          <h1 className="text-center font-heading text-2xl font-extrabold text-coffee-900 dark:text-cream-50 sm:text-3xl">
            ផ្ទាំងគ្រប់គ្រង Arcade 🕹️
          </h1>
          <Link
            href="/"
            aria-label="ទៅកាន់ទីលានហ្គេម · View Arcade"
            className="btn-tactile flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-clay-400 px-5 py-2.5 text-sm font-bold text-white shadow-md lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2"
          >
            <Home size={16} />
            ទៅកាន់ទីលានហ្គេម · View Arcade 🏠
          </Link>
        </div>
      </div>

      {/* 📣 Marketing: broadcast/targeted notifications */}
      <div className="mt-4 px-4 sm:px-6">
        <NotificationsPanel onError={showError} />
      </div>

      {/* 🔔 Telegram notification connection status per registered player */}
      <div className="px-4 sm:px-6">
        <TelegramSubscribersPanel onError={showError} />
      </div>

      {/* 👥 Full registered-player roster */}
      <div className="px-4 sm:px-6">
        <RegisteredCustomersPanel onError={showError} />
      </div>

      {/* 💬 Social Lounge moderation — Staff view/flag/delete, Admin also mutes/bans */}
      <div className="px-4 pb-16 sm:px-6">
        <AdminChatMonitorPanel isAdminRole={isAdminRole} onError={showError} />
      </div>

      {toastMessage && (
        <AdminToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </div>
  );
}
