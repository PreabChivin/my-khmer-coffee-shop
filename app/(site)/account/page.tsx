"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Camera, Loader2, Pencil, Check, X } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LoyaltyProgress from "@/components/loyalty/LoyaltyProgress";
import RewardStore from "@/components/loyalty/RewardStore";
import OrderHistoryList from "@/components/orders/OrderHistoryList";
import RecommendationsCard from "@/components/loyalty/RecommendationsCard";
import LoyaltyLevelBadge from "@/components/loyalty/LoyaltyLevelBadge";
import { generationFromDOB } from "@/lib/generation";
import { compressImageToDataUrl } from "@/lib/imageCompress";
import type { OrderHistoryItemDTO } from "@/lib/types";

const MAX_AVATAR_SOURCE_BYTES = 3 * 1024 * 1024;

export default function AccountPage() {
  const { user, isLoading, logout, refresh } = useSession();
  const { lang, t } = useLanguage();
  const [orders, setOrders] = useState<OrderHistoryItemDTO[] | null>(null);

  // ✏️ Edit-profile form state
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 🖼️ Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/orders/mine")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  function startEditing() {
    if (!user) return;
    setNameInput(user.name);
    setPhoneInput(user.phone ?? "");
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setSaveError(null);
  }

  async function saveProfile() {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setSaveError(t("account.nameEmptyError"));
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: phoneInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? t("account.saveFailed"));
        return;
      }
      await refresh();
      setIsEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    } catch {
      setSaveError(t("account.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file, {
        maxDim: 320,
        quality: 0.7,
        maxSourceBytes: MAX_AVATAR_SOURCE_BYTES,
      });
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.error ?? t("account.saveFailed"));
        return;
      }
      await refresh();
    } catch (err) {
      const reason = err instanceof Error ? err.message : "";
      setAvatarError(
        reason === "too-large"
          ? t("account.imageTooLargeError")
          : reason === "not-an-image"
            ? t("account.notAnImageError")
            : t("account.saveFailed")
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (res.ok) await refresh();
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <p className="text-coffee-400 dark:text-cream-400">{t("account.loading")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="animate-bounce-cute text-5xl">🔒</div>
        <h1 className="mt-3 font-heading text-2xl text-coffee-900 dark:text-cream-50">
          {t("account.lockedTitle")}
        </h1>
        <p className="mt-2 text-sm text-coffee-500 dark:text-cream-300">
          {t("account.lockedSubtitle")}
        </p>
        <Link
          href="/"
          className="mt-6 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-8 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {t("account.backHome")}
        </Link>
      </div>
    );
  }

  const gen = generationFromDOB(user.dateOfBirth);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* 🖼️ Avatar — round picture with a camera-icon overlay to change it,
              wrapped in the spinning gradient story-ring for a premium touch */}
          <div className="story-ring relative shrink-0 rounded-full p-[3px]">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-cream-50 bg-clay-100 text-2xl dark:border-coffee-900 dark:bg-coffee-800">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{gen?.emoji ?? "☕"}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              aria-label={t("account.changePhoto")}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-lavender-500 to-crimson-500 text-white shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-60"
            >
              {isUploadingAvatar ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Camera size={12} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelected}
            />
          </div>

          <div>
            <h1 className="font-heading text-2xl text-coffee-900 dark:text-cream-50">
              {t("account.greeting").replace("{name}", user.name)}
            </h1>
            <p className="text-sm text-coffee-500 dark:text-cream-300">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-coffee-300 px-3 py-1.5 text-xs font-bold text-coffee-500 transition-colors hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-800"
        >
          <LogOut size={13} />
          {t("account.logout")}
        </button>
      </div>

      {/* 🎮 Compact gamified level chip — right under the greeting */}
      <div className="mb-4">
        <LoyaltyLevelBadge points={user.loyaltyPoints} />
      </div>

      {user.avatarUrl && (
        <div className="mb-4 flex justify-start">
          <button
            type="button"
            onClick={removeAvatar}
            disabled={isUploadingAvatar}
            className="text-xs font-semibold text-coffee-400 underline decoration-dotted underline-offset-2 hover:text-crimson-500 disabled:opacity-50 dark:text-cream-400"
          >
            {t("account.removePhoto")}
          </button>
        </div>
      )}
      {avatarError && (
        <p className="mb-4 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
          {avatarError}
        </p>
      )}

      {/* ✏️ Edit Profile — name + phone */}
      <div className="mb-4 rounded-3xl border-2 border-coffee-200 bg-white/60 p-4 dark:border-coffee-700 dark:bg-coffee-800/40">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-coffee-500 dark:text-cream-300">
                {t("account.nameLabel")}
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-3.5 py-2.5 text-sm outline-none focus:border-lavender-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-coffee-500 dark:text-cream-300">
                {t("account.phoneLabel")}
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder={t("account.phonePlaceholder")}
                className="w-full rounded-xl border border-coffee-300 bg-cream-50 px-3.5 py-2.5 text-sm outline-none focus:border-lavender-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
              />
            </div>
            {saveError && (
              <p className="text-xs font-semibold text-crimson-600 dark:text-crimson-400">
                {saveError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {t("account.saveChanges")}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-full border border-coffee-300 px-4 py-2 text-xs font-bold text-coffee-600 transition-colors hover:bg-coffee-100 disabled:opacity-50 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-900"
              >
                <X size={13} />
                {t("account.cancelEdit")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-coffee-900 dark:text-cream-50">
                {user.name}
              </p>
              {user.phone && (
                <p className="text-xs text-coffee-500 dark:text-cream-300">{user.phone}</p>
              )}
              {savedFlash && (
                <p className="mt-1 text-xs font-bold text-matcha-600 dark:text-matcha-400">
                  {t("account.profileSaved")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-coffee-100 px-3.5 py-2 text-xs font-bold text-coffee-700 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-900 dark:text-cream-200"
            >
              <Pencil size={12} />
              {t("account.editProfile")}
            </button>
          </div>
        )}
      </div>

      {/* 🎂 Generation tier — fun personalized blurb from date of birth */}
      {gen && (
        <div className="mb-4 flex items-center gap-3 rounded-3xl border-2 border-clay-300 bg-clay-50 px-4 py-3 dark:border-coffee-600 dark:bg-coffee-800">
          <span className="text-3xl">{gen.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-clay-600 dark:text-clay-400">
              {lang === "km" ? gen.km : gen.label}
            </p>
            <p className="text-xs leading-relaxed text-coffee-600 dark:text-cream-200">
              {gen.slang}
            </p>
          </div>
        </div>
      )}

      {/* ✨ Recommended for you */}
      <RecommendationsCard />

      {/* 💎 Loyalty points + tier progress */}
      <LoyaltyProgress points={user.loyaltyPoints} />

      {/* 🎁 Redeem Rewards store */}
      <RewardStore />

      {/* 🧾 My Orders */}
      <h2 className="mb-3 mt-8 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
        {t("account.myOrders")}
      </h2>
      {orders === null ? (
        <p className="text-sm text-coffee-400 dark:text-cream-400">{t("account.loadingOrders")}</p>
      ) : (
        <OrderHistoryList orders={orders} />
      )}
    </div>
  );
}
