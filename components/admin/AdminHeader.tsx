"use client";

import { useRouter } from "next/navigation";
import { Coffee, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import LanguageToggle from "@/components/LanguageToggle";
import AppearanceSettings from "@/components/AppearanceSettings";

export default function AdminHeader({ name }: { name: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { logout } = useAdminSession();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b-2 border-gold-500/60 bg-cream-50 px-6 py-4 dark:bg-coffee-900">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
          <Coffee size={18} />
        </span>
        <div>
          <p className="font-heading text-lg text-coffee-900 dark:text-cream-50">
            {t("adminDash.kitchenDashboard")}
          </p>
          <p className="text-xs text-coffee-500 dark:text-cream-300">
            {t("adminDash.signedInAs")} {name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageToggle />
        <AppearanceSettings />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-coffee-300 px-4 py-2 text-sm font-semibold text-coffee-700 transition-colors hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-800"
        >
          <LogOut size={16} />
          {t("adminDash.logout")}
        </button>
      </div>
    </header>
  );
}
