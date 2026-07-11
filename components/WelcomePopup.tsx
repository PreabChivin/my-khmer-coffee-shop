"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Gift, Sparkles, X } from "lucide-react";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";

const SEEN_KEY = "cafe-welcome-seen";

/**
 * 🎉 First-visit engagement popup — shown once to new, logged-out visitors on
 * the homepage to promote registration benefits. Dismissal is remembered in
 * localStorage so it never nags a returning guest.
 */
export default function WelcomePopup() {
  const { user, isLoading } = useCustomerSession();
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading || user) return; // wait for session; never show to members
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // ignore
    }
    if (seen) return;
    // Small delay so it feels intentional, not jarring on load.
    const timer = window.setTimeout(() => setShow(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isLoading, user]);

  function dismiss() {
    setShow(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
  }

  function signUp() {
    dismiss();
    openAuth();
  }

  if (!show || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card animate-pop-in relative w-full max-w-sm overflow-hidden rounded-3xl bg-cream-50 dark:bg-coffee-800">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-coffee-500 hover:text-coffee-800 dark:bg-coffee-900/70 dark:text-cream-300"
        >
          <X size={16} />
        </button>

        {/* Pastel hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-clay-400 via-crimson-400 to-clay-500 px-6 py-7 text-center text-white">
          <span className="pointer-events-none absolute -right-3 -top-3 text-6xl opacity-20">🎁</span>
          <span className="pointer-events-none absolute -bottom-4 -left-2 text-5xl opacity-20">💖</span>
          <div className="animate-bounce-cute text-5xl">🧋🎉</div>
          <h2 className="mt-2 font-heading text-xl font-extrabold drop-shadow-sm">
            {t("welcomePopup.greeting")}
          </h2>
        </div>

        <div className="px-6 py-5 text-center">
          <p className="text-sm font-medium leading-relaxed text-coffee-700 dark:text-cream-200">
            {t("welcomePopup.body")}
          </p>

          <div className="mt-4 flex flex-col gap-2 text-left">
            {[
              { icon: <Sparkles size={15} className="text-clay-500" />, text: t("welcomePopup.benefit1") },
              { icon: <Gift size={15} className="text-crimson-500" />, text: t("welcomePopup.benefit2") },
            ].map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl bg-clay-50 px-3 py-2 text-xs font-semibold text-coffee-700 dark:bg-coffee-900 dark:text-cream-200"
              >
                {b.icon}
                {b.text}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={signUp}
            className="mt-5 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            {t("welcomePopup.signUp")}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 w-full text-xs font-medium text-coffee-400 hover:text-coffee-600 dark:text-cream-400"
          >
            {t("welcomePopup.later")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
