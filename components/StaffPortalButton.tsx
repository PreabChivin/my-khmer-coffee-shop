"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Crown, Lock, LogOut } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import AdminLoginModal from "@/components/AdminLoginModal";

/**
 * 🔐 Staff Login Portal — lives in the header's corner. Logged out: a
 * discreet cute button that opens the login modal. Logged in: an
 * always-visible glowing pastel-green badge confirming Staff View is active,
 * with a one-click logout that destroys the session instantly.
 */
export default function StaffPortalButton() {
  const { isAdmin, isChecking, adminName, logout } = useAdminSession();
  const [showModal, setShowModal] = useState(false);

  if (isChecking) return null;

  if (!isAdmin) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-coffee-100 px-3 py-1.5 text-[11px] font-bold text-coffee-500 transition-transform hover:scale-105 dark:bg-coffee-800 dark:text-cream-300"
        >
          <Lock size={12} />
          🔐 សម្រាប់បុគ្គលិកហាង (Staff Portal)
        </button>
        {showModal &&
          createPortal(
            <AdminLoginModal onClose={() => setShowModal(false)} />,
            document.body
          )}
      </>
    );
  }

  return (
    <div className="flex animate-pulse items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-matcha-300 to-matcha-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_14px_rgba(127,209,174,0.8)]">
      <Crown size={12} />
      🧑‍🍳 បុគ្គលិកហាងកាហ្វេ: Active {adminName}
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
  );
}
