"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Gift } from "lucide-react";
import type { AdminRedemptionDTO } from "@/lib/types";

/** 👑 Reward redemptions to fulfil — flagged here the moment a customer
 *  redeems. Staff hand over the item, then mark it fulfilled. */
export default function RedemptionsPanel({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<AdminRedemptionDTO[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || rows !== null) return;
    fetch("/api/admin/redemptions")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: AdminRedemptionDTO[]) => setRows(data))
      .catch(() => onError("Couldn't load redemptions."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function fulfill(id: string) {
    setBusyId(id);
    const prev = rows;
    setRows((r) => r?.map((x) => (x.id === id ? { ...x, status: "FULFILLED" } : x)) ?? null);
    try {
      const res = await fetch(`/api/admin/redemptions/${id}`, { method: "PATCH" });
      if (!res.ok) {
        setRows(prev ?? null);
        onError("Couldn't mark fulfilled.");
      }
    } catch {
      setRows(prev ?? null);
      onError("Network error.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = rows?.filter((r) => r.status === "PENDING").length ?? 0;

  return (
    <div className="khmer-card mx-auto mt-4 max-w-[1600px] rounded-2xl bg-cream-50/60 dark:bg-coffee-800/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <Gift size={18} /> ការប្ដូររង្វាន់ · Reward Redemptions
          {pendingCount > 0 && (
            <span className="animate-pulse rounded-full bg-crimson-500 px-2 py-0.5 text-xs font-bold text-white">
              {pendingCount} រង់ចាំ
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          {rows === null ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              កំពុងផ្ទុក...
            </p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              មិនទាន់មានការប្ដូររង្វាន់ទេ
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-coffee-200 bg-cream-50 px-3 py-2.5 dark:border-coffee-700 dark:bg-coffee-900"
                >
                  <span className="text-2xl">{r.rewardEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-coffee-900 dark:text-cream-50">
                      {r.rewardName} · {r.cost}💎
                    </p>
                    <p className="truncate text-[11px] text-coffee-500 dark:text-cream-300">
                      {r.customerName} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {r.status === "PENDING" ? (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => fulfill(r.id)}
                      className="shrink-0 rounded-full bg-matcha-500 px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      ✅ ប្រគល់រួច
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-coffee-100 px-2.5 py-1 text-[11px] font-bold text-coffee-500 dark:bg-coffee-800 dark:text-cream-300">
                      បានប្រគល់
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
