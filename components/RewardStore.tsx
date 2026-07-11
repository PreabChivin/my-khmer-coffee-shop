"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import type { RedemptionDTO, RewardDTO } from "@/lib/types";

export default function RewardStore() {
  const { user, refresh } = useCustomerSession();
  const [rewards, setRewards] = useState<RewardDTO[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionDTO[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadRedemptions() {
    try {
      const res = await fetch("/api/rewards/redemptions");
      if (res.ok) setRedemptions(await res.json());
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRewards)
      .catch(() => setRewards([]));
    fetch("/api/rewards/redemptions")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRedemptions)
      .catch(() => setRedemptions([]));
  }, []);

  async function redeem(reward: RewardDTO) {
    setBusyId(reward.id);
    setMsg(null);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Couldn't redeem." });
        return;
      }
      setMsg({ ok: true, text: `${reward.emoji} ប្ដូរជោគជ័យ! បង្ហាញនៅ counter ដើម្បីទទួល 🎉` });
      await refresh(); // updates the points balance
      await loadRedemptions();
    } catch {
      setMsg({ ok: false, text: "Network error — please try again." });
    } finally {
      setBusyId(null);
    }
  }

  const points = user?.loyaltyPoints ?? 0;

  return (
    <div className="mt-8">
      <h2 className="mb-3 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
        ហាងប្ដូររង្វាន់ · Redeem Rewards 🎁
      </h2>

      {msg && (
        <p
          className={`mb-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            msg.ok
              ? "bg-matcha-100 text-matcha-700"
              : "bg-crimson-50 text-crimson-600 dark:bg-coffee-950"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rewards.length === 0 && (
          <p className="col-span-full rounded-2xl border-2 border-dashed border-coffee-300 px-6 py-8 text-center text-sm text-coffee-400 dark:border-coffee-600 dark:text-cream-400">
            មិនទាន់មានរង្វាន់ទេ — ឆាប់ៗនេះ! 🌈
          </p>
        )}
        {rewards.map((r) => {
          const affordable = points >= r.cost;
          return (
            <div
              key={r.id}
              className="khmer-card flex items-center gap-3 rounded-2xl bg-cream-50 p-3 dark:bg-coffee-800"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-200 to-crimson-200 text-3xl dark:from-coffee-900 dark:to-coffee-900">
                {r.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-bold text-coffee-900 dark:text-cream-50">
                  {r.nameKh}
                </p>
                <p className="text-xs font-bold text-clay-600 dark:text-clay-400">
                  {r.cost.toLocaleString()} 💎
                </p>
                {r.description && (
                  <p className="truncate text-[11px] text-coffee-400 dark:text-cream-400">
                    {r.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!user || !affordable || busyId === r.id}
                onClick={() => redeem(r)}
                className="shrink-0 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:from-coffee-200 disabled:to-coffee-200 disabled:text-coffee-400"
              >
                {busyId === r.id ? "..." : affordable ? "ប្ដូរ" : "ខ្វះពិន្ទុ"}
              </button>
            </div>
          );
        })}
      </div>

      {redemptions.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 flex items-center gap-1.5 font-heading text-sm font-extrabold text-coffee-900 dark:text-cream-50">
            <Sparkles size={14} className="text-gold-600" />
            ប្រវត្តិការប្ដូររង្វាន់
          </h3>
          <div className="space-y-2">
            {redemptions.map((rd) => (
              <div
                key={rd.id}
                className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm dark:bg-coffee-800"
              >
                <span className="text-coffee-800 dark:text-cream-100">
                  {rd.rewardEmoji} {rd.rewardName}
                  <span className="ml-1 text-[11px] text-coffee-400">
                    −{rd.cost}💎
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    rd.status === "FULFILLED"
                      ? "bg-matcha-500 text-white"
                      : "bg-gold-100 text-gold-700 dark:bg-coffee-900 dark:text-gold-400"
                  }`}
                >
                  {rd.status === "FULFILLED" ? "បានទទួល ✅" : "រង់ចាំទទួល ⏳"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
