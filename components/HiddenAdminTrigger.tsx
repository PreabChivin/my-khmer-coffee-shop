"use client";

import { useState } from "react";
import { Lock, LogOut, Sparkles } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminLoginModal from "@/components/AdminLoginModal";

/**
 * 🔐 A tiny, playful trigger tucked into the corner of every storefront page —
 * near-invisible until hovered. Logged-out: opens the cute login modal.
 * Logged-in: becomes a pill that toggles "Admin Editing Mode" on the homepage.
 */
export default function HiddenAdminTrigger() {
  const { isAdmin, isChecking, isEditingMode, setEditingMode, logout } =
    useAdminSession();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  if (isChecking) return null;

  if (!isAdmin) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          aria-label={t("admin.trigger")}
          className="fixed bottom-4 right-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-coffee-900/10 text-coffee-400 opacity-30 backdrop-blur-sm transition-all hover:scale-110 hover:opacity-100 hover:bg-coffee-900/20 dark:bg-white/10 dark:text-cream-400 dark:hover:bg-white/20"
        >
          <Lock size={14} />
        </button>
        {showModal && <AdminLoginModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-1.5 py-1.5 pr-3 text-white shadow-lg">
      <button
        type="button"
        onClick={() => setEditingMode(!isEditingMode)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles size={13} />
        {isEditingMode ? t("admin.editingOn") : t("admin.editingOff")}
      </button>
      <button
        type="button"
        onClick={logout}
        aria-label={t("adminDash.logout")}
        className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}
