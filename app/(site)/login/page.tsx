"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * 🔐 The one bookmarkable, linkable login URL for every role — customers and
 * staff/admin alike. Reuses AuthModal entirely (no duplicated form code): it
 * just opens it on mount. Staff/Admin redirect to /admin is handled inside
 * AuthModal itself (fires from anywhere the modal is opened); this page adds
 * the customer-only redirect to the storefront once a CUSTOMER session
 * appears, since arriving here specifically to log in should land you back
 * on the menu, not leave you stranded on a blank /login page.
 */
export default function LoginPage() {
  const { user, isLoading } = useSession();
  const { openAuth } = useAuthModal();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      openAuth();
      return;
    }
    if (user.role === "CUSTOMER") {
      router.replace("/");
    }
    // STAFF/ADMIN: AuthModal already redirected to /admin on login; a
    // direct visit here while already signed in as staff falls through to
    // the fallback link below rather than fighting that redirect.
  }, [isLoading, user, openAuth, router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-coffee-400 dark:text-cream-400">
        {isLoading ? t("account.loading") : ""}
      </p>
    </div>
  );
}
