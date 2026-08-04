"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PublicPlayerProfileDTO } from "@/lib/types";

// Safe to statically import THIS modal from anywhere (e.g. ChatGameOverlay,
// which may render inside a server-rendered tree) — the actual WebGL touch
// point is dynamic-imported here internally, not left to callers to remember.
const AvatarCanvas3D = dynamic(() => import("@/components/3d/AvatarCanvas3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[240px] w-full items-center justify-center">
      <Loader2 size={28} className="animate-spin text-white/70" />
    </div>
  ),
});

export default function PublicPlayerModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  const [profile, setProfile] = useState<PublicPlayerProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/players/${userId}/profile`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProfile)
      .catch(() => setError(t("playerCard.loadError")));
  }, [userId, t]);

  const baseCharacter =
    profile?.equipped.find((e) => e.category === "BASE_CHARACTER")?.model3d ?? null;
  const equipped3D =
    profile?.equipped
      .filter((e) => e.category !== "BASE_CHARACTER")
      .map((e) => ({ category: e.category, model3d: e.model3d })) ?? [];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-sm overflow-hidden rounded-3xl bg-coffee-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-heading text-sm font-extrabold text-white">
            {profile ? profile.name : t("playerCard.title")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition-transform hover:scale-110 active:scale-90"
          >
            <X size={14} />
          </button>
        </div>

        {error && <p className="px-4 pb-4 text-sm text-crimson-300">{error}</p>}

        {!error && (
          <AvatarCanvas3D baseCharacter={baseCharacter} equipped={equipped3D} interactive height={240} />
        )}

        {profile && (
          <div className="space-y-3 px-4 pb-4 pt-2">
            <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
              <span className="text-xs font-bold text-white/80">{t("playerCard.points")}</span>
              <span className="font-heading text-sm font-extrabold text-gold-400">
                {profile.loyaltyPoints.toLocaleString()} 💎
              </span>
            </div>

            {profile.badges.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold text-white/60">{t("playerCard.badges")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-gold-500/20 px-2.5 py-1 text-[11px] font-bold text-gold-300"
                    >
                      🏅 {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-bold text-white/60">{t("playerCard.equipped")}</p>
              {profile.equipped.length === 0 ? (
                <p className="text-xs text-white/40">{t("playerCard.noItems")}</p>
              ) : (
                <div className="space-y-1.5">
                  {profile.equipped.map((eq) => (
                    <div
                      key={eq.category}
                      className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5"
                    >
                      <span className="text-lg">{eq.emoji}</span>
                      <span className="text-xs font-semibold text-white/90">
                        {lang === "km" ? eq.nameKh : eq.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
