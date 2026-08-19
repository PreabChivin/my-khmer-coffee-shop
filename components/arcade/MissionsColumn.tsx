"use client";

import MissionsPanel from "@/components/games/MissionsPanel";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { playSound } from "@/lib/soundEngine";

/** 🎯 Dashboard right column: today's real daily missions (the same
 *  MissionsPanel the account page uses), or a sign-in nudge for guests. */
export default function MissionsColumn() {
  const { user } = useSession();
  const { openAuth } = useAuthModal();
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="khmer-card rounded-3xl border-2 border-dashed border-clay-300 bg-clay-50/70 p-5 text-center backdrop-blur-sm dark:border-coffee-600 dark:bg-coffee-900/50">
        <p className="text-3xl">🎯</p>
        <p className="mt-1.5 font-heading text-sm font-bold text-coffee-900 dark:text-cream-50">
          {t("home.railGuestMissionsTitle")}
        </p>
        <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">
          {t("home.railGuestMissionsDesc")}
        </p>
        <button
          type="button"
          onClick={() => {
            playSound("click");
            openAuth();
          }}
          className="btn-tactile mt-3 rounded-full bg-gradient-to-r from-accent to-accent-hover px-5 py-2 text-xs font-bold text-white shadow-sm"
        >
          {t("home.railSignIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="khmer-card rounded-3xl border border-gold-500/30 bg-cream-50/80 px-4 pb-4 pt-1 backdrop-blur-sm dark:bg-coffee-800/60">
      <MissionsPanel />
    </div>
  );
}
