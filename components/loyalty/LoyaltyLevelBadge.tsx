"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { tierProgress } from "@/lib/loyaltyPoints";

/** 🎮 Compact gamified level chip — sits right next to the account greeting,
 *  distinct from the full-width LoyaltyProgress card further down the page.
 *  Reuses the same tierProgress() source of truth so the two never disagree. */
export default function LoyaltyLevelBadge({ points }: { points: number }) {
  const { lang, t } = useLanguage();
  const { current, next, percent, pointsToNext } = tierProgress(points);
  const tierName = (tier: { name: string; km: string }) =>
    lang === "km" ? tier.km : tier.name;
  const tierLabel = (tier: { name: string; km: string; emoji: string }) =>
    `${tier.emoji} ${tierName(tier)}`;

  return (
    <div className="glow-ring flex items-center gap-2.5 rounded-full bg-gradient-to-r from-clay-400 via-crimson-400 to-clay-500 py-1.5 pl-1.5 pr-3.5 text-white shadow-md">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-base backdrop-blur-sm">
        {current.emoji}
      </span>
      <div className="min-w-[92px]">
        <p className="text-[10px] font-extrabold uppercase leading-none tracking-wide text-white/85">
          {tierName(current)}
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-0.5 truncate text-[9px] font-semibold leading-none text-white/80">
          {next
            ? t("loyalty2.toNext")
                .replace("{n}", pointsToNext.toLocaleString())
                .replace("{tier}", tierLabel(next))
            : t("loyalty2.maxTier").replace("{tier}", tierLabel(current))}
        </p>
      </div>
    </div>
  );
}
