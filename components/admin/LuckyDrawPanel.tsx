"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Ticket } from "lucide-react";
import type { LuckyDrawDTO } from "@/lib/types";

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/** 🎟️ Monthly Lucky Draw — configure a raffle (prize + eligibility by minimum
 *  lifetime points / tier) and draw a random eligible winner, who is notified. */
export default function LuckyDrawPanel({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draws, setDraws] = useState<LuckyDrawDTO[] | null>(null);
  const [form, setForm] = useState({
    title: "",
    prizeName: "",
    prizeEmoji: "🎁",
    month: currentMonth(),
    minPoints: "",
    tierLabel: "",
  });
  const [busy, setBusy] = useState(false);
  const [drawingId, setDrawingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || draws !== null) return;
    fetch("/api/admin/lucky-draws")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: LuckyDrawDTO[]) => setDraws(d))
      .catch(() => onError("Couldn't load lucky draws."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/lucky-draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          prizeName: form.prizeName,
          prizeEmoji: form.prizeEmoji || "🎁",
          month: form.month,
          minPoints: Number(form.minPoints) || 0,
          tierLabel: form.tierLabel || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Couldn't create draw.");
        return;
      }
      setDraws((d) => [data, ...(d ?? [])]);
      setForm({ title: "", prizeName: "", prizeEmoji: "🎁", month: currentMonth(), minPoints: "", tierLabel: "" });
    } catch {
      onError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function drawWinner(id: string) {
    setDrawingId(id);
    try {
      const res = await fetch(`/api/admin/lucky-draws/${id}/draw`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Couldn't draw.");
        return;
      }
      setDraws(
        (d) =>
          d?.map((x) =>
            x.id === id
              ? { ...x, winnerName: data.winnerName, drawnAt: new Date().toISOString() }
              : x
          ) ?? null
      );
    } catch {
      onError("Network error.");
    } finally {
      setDrawingId(null);
    }
  }

  const inputCls =
    "rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50";

  return (
    <div className="khmer-card mx-auto mt-4 max-w-[1600px] rounded-2xl bg-cream-50/60 dark:bg-coffee-800/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <Ticket size={18} /> ចាប់រង្វាន់ប្រចាំខែ · Monthly Lucky Draw
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          <form onSubmit={create} className="rounded-2xl border-2 border-dashed border-clay-400 bg-clay-50/60 p-3 dark:bg-coffee-900/40">
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="ចំណងជើង · Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
              <input required type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className={inputCls} />
            </div>
            <div className="mt-2 grid grid-cols-[3rem_1fr] gap-2">
              <input value={form.prizeEmoji} onChange={(e) => setForm({ ...form, prizeEmoji: e.target.value })} className={`${inputCls} text-center text-lg`} />
              <input required placeholder="រង្វាន់ · Prize" value={form.prizeName} onChange={(e) => setForm({ ...form, prizeName: e.target.value })} className={inputCls} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input type="number" min="0" placeholder="ពិន្ទុអប្បបរមា · Min points" value={form.minPoints} onChange={(e) => setForm({ ...form, minPoints: e.target.value })} onWheel={(e) => e.currentTarget.blur()} className={inputCls} />
              <input placeholder="Tier (optional, e.g. Gold)" value={form.tierLabel} onChange={(e) => setForm({ ...form, tierLabel: e.target.value })} className={inputCls} />
            </div>
            <button type="submit" disabled={busy} className="mt-3 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60">
              {busy ? "..." : "🎟️ បង្កើតការចាប់រង្វាន់"}
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {draws === null ? (
              <p className="py-4 text-center text-sm text-coffee-400 dark:text-cream-400">កំពុងផ្ទុក...</p>
            ) : draws.length === 0 ? (
              <p className="py-4 text-center text-sm text-coffee-400 dark:text-cream-400">មិនទាន់មានការចាប់រង្វាន់ទេ</p>
            ) : (
              draws.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-coffee-200 bg-cream-50 px-3 py-2.5 dark:border-coffee-700 dark:bg-coffee-900">
                  <span className="text-2xl">{d.prizeEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-coffee-900 dark:text-cream-50">
                      {d.title} · {d.prizeName}
                    </p>
                    <p className="truncate text-[11px] text-coffee-500 dark:text-cream-300">
                      {d.month} · ≥{d.minPoints}💎{d.tierLabel ? ` (${d.tierLabel})` : ""}
                    </p>
                  </div>
                  {d.winnerName ? (
                    <span className="shrink-0 rounded-full bg-matcha-500 px-2.5 py-1 text-[11px] font-bold text-white">
                      🏆 {d.winnerName}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={drawingId === d.id}
                      onClick={() => drawWinner(d.id)}
                      className="shrink-0 rounded-full bg-gradient-to-r from-gold-400 to-clay-400 px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    >
                      🎲 ចាប់រង្វាន់
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
