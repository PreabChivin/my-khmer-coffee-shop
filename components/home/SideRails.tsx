"use client";

import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoyaltyProgress from "@/components/loyalty/LoyaltyProgress";
import MissionsPanel from "@/components/games/MissionsPanel";

// Rails only turn on once there's real free margin beside the centered
// max-w-6xl (1152px) column: 576 (half content) + 24 (gap) + 288 (rail) = 888.
const RAIL_BASE =
  "hidden min-[1850px]:flex fixed top-28 bottom-24 z-20 w-72 flex-col gap-4 overflow-y-auto";

function GuestRailCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  const { t } = useLanguage();
  const { openAuth } = useAuthModal();
  return (
    <div className="khmer-card rounded-3xl border-2 border-dashed border-clay-300 bg-clay-50/60 p-4 text-center dark:border-coffee-600 dark:bg-coffee-900/40">
      <p className="text-2xl">{emoji}</p>
      <p className="mt-1 font-heading text-sm font-bold text-coffee-900 dark:text-cream-50">
        {title}
      </p>
      <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">{desc}</p>
      <button
        type="button"
        onClick={openAuth}
        className="mt-3 rounded-full bg-gradient-to-r from-accent to-accent-hover px-4 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        {t("home.railSignIn")}
      </button>
    </div>
  );
}

/** 💎 Left rail: the account's Arcade Points/tier progress (or a sign-in
 *  nudge for guests). */
export function HomeLeftRail() {
  const { user } = useSession();
  const { t } = useLanguage();

  return (
    <aside className={`${RAIL_BASE} left-[calc(50%-888px)]`} aria-label="quick access">
      {user ? (
        <LoyaltyProgress points={user.loyaltyPoints} />
      ) : (
        <GuestRailCard
          emoji="💎"
          title={t("home.railGuestLoyaltyTitle")}
          desc={t("home.railGuestLoyaltyDesc")}
        />
      )}
    </aside>
  );
}

/** 🎯 Right rail: daily missions (or a sign-in nudge) — already powers the
 *  account page, just re-laid-out for a narrow column here. */
export function HomeRightRail() {
  const { user } = useSession();
  const { t } = useLanguage();

  return (
    <aside className={`${RAIL_BASE} right-[calc(50%-888px)]`} aria-label="missions">
      {user ? (
        <MissionsPanel />
      ) : (
        <GuestRailCard
          emoji="🎯"
          title={t("home.railGuestMissionsTitle")}
          desc={t("home.railGuestMissionsDesc")}
        />
      )}
    </aside>
  );
}
