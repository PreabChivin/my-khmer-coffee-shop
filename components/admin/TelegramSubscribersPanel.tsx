"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Send, Copy, Check, MessageCircle } from "lucide-react";
import { openExternalUrl } from "@/lib/openExternal";
import type { TelegramSubscriberDTO, TelegramSubscriberStatsDTO } from "@/lib/types";

type StatusFilter = "ALL" | "CONNECTED" | "NOT_CONNECTED";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

/** 🔔 Telegram Subscribers — admin visibility into which registered
 *  customers have linked Telegram for order notifications, plus a way to
 *  test-fire a DM to any discovered chat id. Connection status is DERIVED
 *  (no User.telegramChatId column exists) — see lib/telegramSubscribers.ts. */
export default function TelegramSubscribersPanel({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<TelegramSubscriberStatsDTO | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testBusyId, setTestBusyId] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || data !== null) return;
    fetch("/api/admin/telegram-subscribers")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body: TelegramSubscriberStatsDTO) => setData(body))
      .catch(() => onError("Couldn't load Telegram subscribers — the database may be busy."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const visible = useMemo(() => {
    const rows = data?.subscribers ?? [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "CONNECTED" && !r.isTelegramConnected) return false;
      if (statusFilter === "NOT_CONNECTED" && r.isTelegramConnected) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.telegramUsername ?? "").toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    });
  }, [data, query, statusFilter]);

  async function copyChatId(row: TelegramSubscriberDTO) {
    if (!row.telegramChatId) return;
    try {
      await navigator.clipboard.writeText(row.telegramChatId);
      setCopiedId(row.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard unavailable — silently ignore, the badge text is still selectable
    }
  }

  async function sendTest(row: TelegramSubscriberDTO) {
    if (!row.telegramChatId) return;
    setTestBusyId(row.id);
    setTestMsg(null);
    try {
      const res = await fetch("/api/admin/telegram-subscribers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: row.telegramChatId }),
      });
      const body = await res.json();
      setTestMsg({
        id: row.id,
        ok: res.ok,
        text: res.ok ? "✅ បានផ្ញើ! Sent." : (body.error ?? "Couldn't send."),
      });
    } catch {
      setTestMsg({ id: row.id, ok: false, text: "Network error." });
    } finally {
      setTestBusyId(null);
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
          <MessageCircle size={18} /> ការជូនដំណឹង Telegram · Telegram Subscribers
          {data && (
            <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-bold text-coffee-600 dark:bg-coffee-900 dark:text-cream-200">
              {data.connectedCount}/{data.totalUsers}
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          {data === null ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              កំពុងផ្ទុក...
            </p>
          ) : (
            <>
              {/* 📊 Summary metric cards */}
              <div className="mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-gold-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                    Total Users
                  </p>
                  <p className="text-lg font-extrabold text-coffee-900 dark:text-cream-50">
                    {data.totalUsers}
                  </p>
                </div>
                <div className="rounded-2xl bg-matcha-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                    Telegram Connected
                  </p>
                  <p className="text-lg font-extrabold text-matcha-700 dark:text-matcha-400">
                    {data.connectedCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-lavender-100 px-2 py-2.5 text-center dark:bg-coffee-900">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
                    Discovered Chat IDs
                  </p>
                  <p className="text-lg font-extrabold text-coffee-900 dark:text-cream-50">
                    {data.discoveredChatIdCount}
                  </p>
                </div>
              </div>
              {data.discoveredChatIdCount > data.connectedCount && (
                <p className="mb-3 text-[11px] text-coffee-400 dark:text-cream-400">
                  ℹ️ {data.discoveredChatIdCount - data.connectedCount} chat id(s) have messaged the
                  bot (device-linked or guest checkout) but aren&apos;t tied to a registered account
                  yet.
                </p>
              )}

              {/* 🔎 Search + status filter */}
              <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ស្វែងរកតាមឈ្មោះ ឬ Username..."
                  className="flex-1 rounded-xl border border-coffee-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
                />
                <div className="flex gap-1.5">
                  {(
                    [
                      { key: "ALL", label: "ទាំងអស់" },
                      { key: "CONNECTED", label: "ACTIVE" },
                      { key: "NOT_CONNECTED", label: "NOT CONNECTED" },
                    ] as { key: StatusFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setStatusFilter(f.key)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        statusFilter === f.key
                          ? "bg-gradient-to-r from-clay-400 to-crimson-400 text-white"
                          : "bg-cream-100 text-coffee-500 dark:bg-coffee-800 dark:text-cream-300"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
                  មិនមានទិន្នន័យទេ
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-coffee-200 text-left text-xs uppercase tracking-wide text-coffee-400 dark:border-coffee-700 dark:text-cream-400">
                        <th className="px-2 py-2 font-bold">User Profile</th>
                        <th className="px-2 py-2 font-bold">Username</th>
                        <th className="px-2 py-2 font-bold">Chat ID</th>
                        <th className="px-2 py-2 font-bold">Status</th>
                        <th className="px-2 py-2 font-bold">Connected</th>
                        <th className="px-2 py-2 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-coffee-100 dark:border-coffee-800"
                        >
                          <td className="px-2 py-2.5">
                            <p className="font-semibold text-coffee-900 dark:text-cream-50">
                              {row.name}
                            </p>
                            <p className="text-[11px] text-coffee-400 dark:text-cream-400">
                              {row.phone ?? row.email}
                            </p>
                          </td>
                          <td className="px-2 py-2.5">
                            {row.telegramUsername ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openExternalUrl(`https://t.me/${row.telegramUsername}`)
                                }
                                className="font-semibold text-clay-600 hover:underline dark:text-clay-400"
                              >
                                @{row.telegramUsername}
                              </button>
                            ) : (
                              <span className="text-coffee-400 dark:text-cream-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            {row.telegramChatId ? (
                              <button
                                type="button"
                                onClick={() => copyChatId(row)}
                                title="Copy chat_id"
                                className="flex items-center gap-1 rounded-lg bg-coffee-100 px-2 py-1 font-mono text-[11px] text-coffee-700 transition-colors hover:bg-coffee-200 dark:bg-coffee-900 dark:text-cream-200 dark:hover:bg-coffee-800"
                              >
                                {row.telegramChatId}
                                {copiedId === row.id ? (
                                  <Check size={11} className="text-matcha-500" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            ) : (
                              <span className="text-coffee-400 dark:text-cream-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                row.isTelegramConnected
                                  ? "bg-matcha-500 text-white"
                                  : "bg-coffee-200 text-coffee-500 dark:bg-coffee-900 dark:text-cream-400"
                              }`}
                            >
                              {row.isTelegramConnected ? "ACTIVE" : "NOT CONNECTED"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2.5 text-coffee-600 dark:text-cream-300">
                            {row.telegramConnectedAt ? formatDate(row.telegramConnectedAt) : "—"}
                          </td>
                          <td className="px-2 py-2.5">
                            {row.telegramChatId && (
                              <button
                                type="button"
                                disabled={testBusyId === row.id}
                                onClick={() => sendTest(row)}
                                className="flex items-center gap-1 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-2.5 py-1.5 text-[11px] font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                              >
                                <Send size={11} />
                                {testBusyId === row.id ? "..." : "Test"}
                              </button>
                            )}
                            {testMsg?.id === row.id && (
                              <p
                                className={`mt-1 text-[10px] font-semibold ${
                                  testMsg.ok ? "text-matcha-600" : "text-crimson-600"
                                }`}
                              >
                                {testMsg.text}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
