"use client";

import { useEffect, useState } from "react";
import { Gift, X, Scale } from "lucide-react";
import { tierProgress } from "@/lib/loyaltyPoints";
import type { CustomerProfileDTO, PointsAdjustmentDTO } from "@/lib/types";

const POINTS_REASONS = ["Manual Reward", "Event Bonus", "Admin Correction", "Other"] as const;

/** 👑 Admin drill-down: a customer's account, points/tier, and lifetime
 *  arcade scoreboard. Fetches /api/admin/customers/[id]. */
export default function CustomerHistoryModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<CustomerProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🎁 Direct gift giver
  const [showGift, setShowGift] = useState(false);
  const [gift, setGift] = useState({ points: "", badge: "", message: "" });
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftMsg, setGiftMsg] = useState<string | null>(null);

  // 💎 Points adjustment (add/deduct + reason, logged for audit)
  const [showPoints, setShowPoints] = useState(false);
  const [pointsSign, setPointsSign] = useState<1 | -1>(1);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsReason, setPointsReason] = useState<(typeof POINTS_REASONS)[number]>("Manual Reward");
  const [pointsNote, setPointsNote] = useState("");
  const [pointsBusy, setPointsBusy] = useState(false);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<PointsAdjustmentDTO[]>([]);

  function loadAdjustments() {
    fetch(`/api/admin/customers/${userId}/points`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setAdjustments)
      .catch(() => setAdjustments([]));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/customers/${userId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
        return res.json();
      })
      .then((data: CustomerProfileDTO) => {
        if (!cancelled) setProfile(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    fetch(`/api/admin/customers/${userId}/points`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setAdjustments(data);
      })
      .catch(() => {
        if (!cancelled) setAdjustments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function submitPointsAdjustment(e: React.FormEvent) {
    e.preventDefault();
    const magnitude = Math.abs(Number(pointsAmount));
    if (!magnitude) {
      setPointsMsg("សូមបញ្ចូលចំនួនពិន្ទុ។");
      return;
    }
    const reason = pointsReason === "Other" ? pointsNote.trim() || "Other" : pointsReason;
    setPointsBusy(true);
    setPointsMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: magnitude * pointsSign, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPointsMsg(data.error ?? "Couldn't adjust points.");
        return;
      }
      setPointsMsg("✅ បានកែតម្រូវពិន្ទុជោគជ័យ!");
      setPointsAmount("");
      setPointsNote("");
      setShowPoints(false);
      setProfile((p) => (p ? { ...p, user: { ...p.user, loyaltyPoints: data.loyaltyPoints } } : p));
      loadAdjustments();
    } catch {
      setPointsMsg("Network error — please try again.");
    } finally {
      setPointsBusy(false);
    }
  }

  async function sendGift(e: React.FormEvent) {
    e.preventDefault();
    setGiftBusy(true);
    setGiftMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${userId}/gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: Number(gift.points) || 0,
          badge: gift.badge || undefined,
          message: gift.message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGiftMsg(data.error ?? "Couldn't send gift.");
        return;
      }
      setGiftMsg("✅ បានផ្ដល់ជូនជោគជ័យ!");
      setGift({ points: "", badge: "", message: "" });
      setShowGift(false);
      // Reflect the new points/badges locally.
      setProfile((p) =>
        p ? { ...p, user: { ...p.user, loyaltyPoints: data.loyaltyPoints } } : p
      );
    } catch {
      setGiftMsg("Network error — please try again.");
    } finally {
      setGiftBusy(false);
    }
  }

  const tier = profile ? tierProgress(profile.user.loyaltyPoints) : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>

        {error ? (
          <p className="py-8 text-center text-sm text-crimson-600">{error}</p>
        ) : !profile ? (
          <p className="py-8 text-center text-sm text-coffee-400 dark:text-cream-400">
            កំពុងផ្ទុក...
          </p>
        ) : (
          <>
            <div className="pr-6">
              <h3 className="font-heading text-lg text-coffee-900 dark:text-cream-50">
                👤 {profile.user.name}
              </h3>
              <p className="text-xs text-coffee-500 dark:text-cream-300">
                {profile.user.email}
                {profile.user.phone ? ` · ${profile.user.phone}` : ""}
              </p>
            </div>

            {/* Arcade scoreboard + points + tier snapshot */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              <div className="rounded-2xl bg-matcha-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  Wins
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  {profile.gameWins}
                </p>
              </div>
              <div className="rounded-2xl bg-clay-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  Losses
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  {profile.gameLosses}
                </p>
              </div>
              <div className="rounded-2xl bg-gold-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  Ties
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  {profile.gameTies}
                </p>
              </div>
              <div className="rounded-2xl bg-crimson-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                  Points
                </p>
                <p className="text-base font-extrabold text-coffee-900 dark:text-cream-50">
                  {profile.user.loyaltyPoints.toLocaleString()}
                </p>
              </div>
            </div>
            {tier && (
              <p className="mt-2 text-center text-xs font-bold text-clay-600 dark:text-clay-400">
                {tier.current.emoji} {tier.current.name} member
              </p>
            )}

            {/* 🎁 Direct Gift/Reward Giver */}
            <div className="mt-3">
              {giftMsg && (
                <p className="mb-2 rounded-lg bg-matcha-100 px-3 py-1.5 text-xs font-semibold text-matcha-700">
                  {giftMsg}
                </p>
              )}
              {showGift ? (
                <form
                  onSubmit={sendGift}
                  className="rounded-2xl border-2 border-dashed border-crimson-400 bg-crimson-50/60 p-3 dark:bg-coffee-900/40"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="💎 ពិន្ទុ (points)"
                      value={gift.points}
                      onChange={(e) => setGift({ ...gift, points: e.target.value })}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="rounded-lg border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                    />
                    <input
                      placeholder="🏅 ផ្លាកសញ្ញា (badge)"
                      value={gift.badge}
                      onChange={(e) => setGift({ ...gift, badge: e.target.value })}
                      className="rounded-lg border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                    />
                  </div>
                  <input
                    placeholder="💌 សារផ្ទាល់ខ្លួន (optional)"
                    value={gift.message}
                    onChange={(e) => setGift({ ...gift, message: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-crimson-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={giftBusy}
                      className="flex-1 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {giftBusy ? "..." : "🎁 ផ្ដល់ជូន"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGift(false)}
                      className="rounded-full border border-coffee-300 px-3 text-xs font-semibold text-coffee-500 dark:border-coffee-600 dark:text-cream-300"
                    >
                      បោះបង់
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGift(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-crimson-400 py-2 text-xs font-bold text-crimson-600 hover:bg-crimson-50 dark:text-crimson-400 dark:hover:bg-coffee-900"
                >
                  <Gift size={14} /> ផ្ដល់អំណោយ · Send Gift (points / badge)
                </button>
              )}
            </div>

            {/* ⚖️ Points Management — add/deduct with a reason, logged to
                PointsAdjustment. Distinct from the gift flow above (which
                stays always-positive, for badges/thank-you messages). */}
            <div className="mt-3">
              {pointsMsg && (
                <p className="mb-2 rounded-lg bg-matcha-100 px-3 py-1.5 text-xs font-semibold text-matcha-700">
                  {pointsMsg}
                </p>
              )}
              {showPoints ? (
                <form
                  onSubmit={submitPointsAdjustment}
                  className="rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50/60 p-3 dark:bg-coffee-900/40"
                >
                  <div className="mb-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPointsSign(1)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                        pointsSign === 1
                          ? "bg-matcha-500 text-white"
                          : "bg-cream-100 text-coffee-500 dark:bg-coffee-800 dark:text-cream-300"
                      }`}
                    >
                      ➕ Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setPointsSign(-1)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold ${
                        pointsSign === -1
                          ? "bg-crimson-500 text-white"
                          : "bg-cream-100 text-coffee-500 dark:bg-coffee-800 dark:text-cream-300"
                      }`}
                    >
                      ➖ Deduct
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="💎 ចំនួន (amount)"
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(e.target.value)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="rounded-lg border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                    />
                    <select
                      value={pointsReason}
                      onChange={(e) => setPointsReason(e.target.value as (typeof POINTS_REASONS)[number])}
                      className="rounded-lg border border-coffee-300 px-2 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                    >
                      {POINTS_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  {pointsReason === "Other" && (
                    <input
                      placeholder="មូលហេតុ (reason note)"
                      value={pointsNote}
                      onChange={(e) => setPointsNote(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                    />
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={pointsBusy}
                      className="flex-1 rounded-full bg-gradient-to-r from-clay-400 to-coffee-500 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {pointsBusy ? "..." : "⚖️ អនុវត្ត · Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPoints(false)}
                      className="rounded-full border border-coffee-300 px-3 text-xs font-semibold text-coffee-500 dark:border-coffee-600 dark:text-cream-300"
                    >
                      បោះបង់
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPoints(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-clay-400 py-2 text-xs font-bold text-clay-600 hover:bg-clay-50 dark:text-clay-400 dark:hover:bg-coffee-900"
                >
                  <Scale size={14} /> គ្រប់គ្រងពិន្ទុ · Manage Points (add/deduct)
                </button>
              )}

              {adjustments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {adjustments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-lg bg-cream-100 px-2.5 py-1.5 text-[11px] dark:bg-coffee-900"
                    >
                      <span className="text-coffee-700 dark:text-cream-200">
                        <span className={a.amount > 0 ? "font-bold text-matcha-600" : "font-bold text-crimson-600"}>
                          {a.amount > 0 ? "+" : ""}
                          {a.amount}
                        </span>{" "}
                        {a.reason}
                        {a.adminName && (
                          <span className="text-coffee-400 dark:text-cream-400"> · {a.adminName}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-coffee-400 dark:text-cream-400">
                        → {a.balanceAfter.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
