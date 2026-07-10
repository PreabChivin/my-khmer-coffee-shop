"use client";

import { Crown, LogOut } from "lucide-react";
import { useAdminSession } from "@/contexts/AdminSessionContext";

/**
 * 🔐 Staff status badge — the login button is intentionally gone (customers
 * never see a way in). Logging in happens via the hidden Ctrl+S / ⌘+S
 * shortcut (see StaffPortalShortcut). This renders NOTHING for logged-out
 * visitors; once a staff member is signed in it shows a glowing pastel-green
 * badge with a one-click logout.
 */
export default function StaffPortalButton() {
  const { isAdmin, isChecking, adminName, logout } = useAdminSession();

  if (isChecking || !isAdmin) return null;

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
