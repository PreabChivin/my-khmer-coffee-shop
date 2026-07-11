"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Megaphone } from "lucide-react";
import type { AdminCustomerRowDTO } from "@/lib/types";

/** 👑 Targeted Notification Engine — broadcast an alert to ALL customers or
 *  DM a single customer. Sent alerts light up the client notification bell. */
export default function NotificationsPanel({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomerRowDTO[]>([]);
  const [form, setForm] = useState({
    emoji: "📣",
    title: "",
    body: "",
    href: "",
    target: "all", // "all" or a userId
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || customers.length > 0) return;
    fetch("/api/admin/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCustomers)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji: form.emoji || "📣",
          title: form.title,
          body: form.body,
          href: form.href || undefined,
          userId: form.target === "all" ? undefined : form.target,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Couldn't send.");
        return;
      }
      setMsg(data.broadcast ? "📣 បានផ្សាយទៅអតិថិជនទាំងអស់!" : "💌 បានផ្ញើទៅអតិថិជនម្នាក់!");
      setForm({ emoji: "📣", title: "", body: "", href: "", target: "all" });
    } catch {
      onError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="khmer-card mx-auto mt-4 max-w-[1600px] rounded-2xl bg-cream-50/60 dark:bg-coffee-800/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <Megaphone size={18} /> ការជូនដំណឹង · Broadcast &amp; Alerts
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <form onSubmit={send} className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          {msg && (
            <p className="mb-2 rounded-lg bg-matcha-100 px-3 py-1.5 text-xs font-semibold text-matcha-700">
              {msg}
            </p>
          )}
          <div className="grid grid-cols-[3rem_1fr] gap-2">
            <input
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              className="rounded-xl border border-coffee-300 px-2 py-2 text-center text-lg outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900"
            />
            <input
              required
              placeholder="ចំណងជើង · Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
          </div>
          <textarea
            required
            rows={2}
            placeholder="សារ · Message"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="mt-2 w-full rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              placeholder="Link (optional, e.g. /orders)"
              value={form.href}
              onChange={(e) => setForm({ ...form, href: e.target.value })}
              className="rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
            <select
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
              className="rounded-xl border border-coffee-300 px-3 py-2 text-sm text-coffee-900 outline-none focus:border-clay-400 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            >
              <option value="all">📣 អតិថិជនទាំងអស់ (Broadcast)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  💌 {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
          >
            {busy ? "កំពុងផ្ញើ..." : "📣 ផ្ញើការជូនដំណឹង"}
          </button>
        </form>
      )}
    </div>
  );
}
