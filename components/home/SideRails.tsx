"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoyaltyProgress from "@/components/loyalty/LoyaltyProgress";
import MissionsPanel from "@/components/games/MissionsPanel";
import GroupCartBanner from "@/components/cart/GroupCartBanner";
import ProductCard from "@/components/menu/ProductCard";
import type { RecommendationDTO } from "@/lib/types";

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

/** ✨ Same data as RecommendationsCard (GET /api/recommendations), but laid
 *  out as a single narrow column — the card's own sm:/lg: grid assumes a
 *  full-width page section, which would squeeze into a ~288px rail. */
function RailRecommendations() {
  const { t } = useLanguage();
  const [picks, setPicks] = useState<RecommendationDTO[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/recommendations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RecommendationDTO[]) => {
        if (!cancelled) setPicks(data);
      })
      .catch(() => {
        if (!cancelled) setPicks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!picks || picks.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-heading text-base font-extrabold text-coffee-900 dark:text-cream-50">
        {t("account.recommendedTitle")}
      </h2>
      <div className="flex flex-col gap-4">
        {picks.slice(0, 2).map((pick) => (
          <ProductCard key={pick.product.id} product={pick.product} />
        ))}
      </div>
    </div>
  );
}

/** 💎 Left rail: whatever's live right now — an in-progress group cart takes
 *  priority, then the account's Cafe Points/tier progress (or a sign-in
 *  nudge for guests). */
export function HomeLeftRail() {
  const { user } = useSession();
  const { t } = useLanguage();

  return (
    <aside className={`${RAIL_BASE} left-[calc(50%-888px)]`} aria-label="quick access">
      <GroupCartBanner />
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

/** 🎯 Right rail: daily missions (or a sign-in nudge) plus personalized
 *  product picks — both already power the account page, just re-laid-out
 *  for a narrow column here. */
export function HomeRightRail() {
  const { user } = useSession();
  const { t } = useLanguage();

  return (
    <aside className={`${RAIL_BASE} right-[calc(50%-888px)]`} aria-label="rewards and picks">
      {user ? (
        <MissionsPanel />
      ) : (
        <GuestRailCard
          emoji="🎯"
          title={t("home.railGuestMissionsTitle")}
          desc={t("home.railGuestMissionsDesc")}
        />
      )}
      <RailRecommendations />
    </aside>
  );
}
