"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAdminSession } from "@/contexts/AdminSessionContext";
import AdminLoginModal from "@/components/AdminLoginModal";

/**
 * 🔐 Hidden Staff Portal — the login button is no longer shown to customers.
 * Instead, staff press Ctrl+S (⌘+S on Mac) anywhere on the site to summon the
 * login overlay. We swallow the browser's default "Save page" action so the
 * shortcut is dedicated to the portal. Only opens for logged-out visitors —
 * once signed in, staff use the header badge to log out.
 */
export default function StaffPortalShortcut() {
  const { isAdmin } = useAdminSession();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isSaveCombo =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
      if (!isSaveCombo) return;
      event.preventDefault();
      if (!isAdmin) setIsOpen(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdmin]);

  // AdminLoginModal calls onClose() itself on a successful login, so there's
  // no separate "auto-dismiss on admin" effect to maintain here.
  if (!isOpen || typeof document === "undefined") return null;
  return createPortal(
    <AdminLoginModal onClose={() => setIsOpen(false)} />,
    document.body
  );
}
