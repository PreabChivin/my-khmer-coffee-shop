"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Flag,
  Trash2,
  VolumeX,
  Volume2,
  Ban,
  ShieldCheck,
  X,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import CustomerHistoryModal from "@/components/admin/CustomerHistoryModal";
import type { AdminChatMessageDTO } from "@/lib/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isMuted(chatMutedUntil: string | null): boolean {
  return !!chatMutedUntil && new Date(chatMutedUntil).getTime() > Date.now();
}

const MUTE_PRESETS = [
  { label: "១០ នាទី", minutes: 10 },
  { label: "១ ម៉ោង", minutes: 60 },
  { label: "២៤ ម៉ោង", minutes: 1440 },
  { label: "៧ ថ្ងៃ", minutes: 10080 },
];

/** 👑 Admin Chat Monitor — Staff/Admin can view + flag + delete messages;
 *  mute/ban (account-level chat punishment) is ADMIN only, mirroring the
 *  existing deactivate/purge gating in AdminUserManagementPanel. */
export default function AdminChatMonitorPanel({
  isAdminRole,
  onError,
}: {
  isAdminRole: boolean;
  onError: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AdminChatMessageDTO[] | null>(null);
  const [filter, setFilter] = useState<"all" | "flagged">("all");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [muteTarget, setMuteTarget] = useState<AdminChatMessageDTO["author"] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);

  // Deliberately does NOT reset messages to null before the fetch resolves
  // (matches RegisteredCustomersPanel's pattern) — switching filters keeps
  // showing the previous list until the new one arrives, rather than
  // flashing a loading state, and avoids a synchronous setState-in-effect.
  function load() {
    fetch(`/api/admin/chat/messages${filter === "flagged" ? "?flaggedOnly=true" : ""}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { messages: AdminChatMessageDTO[] }) => setMessages(data.messages))
      .catch(() => onError("Couldn't load chat — the database may be busy."));
  }

  useEffect(() => {
    if (!isOpen) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filter]);

  function patchAuthor(userId: string, patch: Partial<AdminChatMessageDTO["author"]>) {
    setMessages(
      (prev) =>
        prev?.map((m) =>
          m.author.id === userId ? { ...m, author: { ...m.author, ...patch } } : m
        ) ?? null
    );
  }

  async function toggleFlag(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/chat/messages/${id}/flag`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMessages(
          (prev) => prev?.map((m) => (m.id === id ? { ...m, flagged: data.flagged } : m)) ?? null
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("តើអ្នកប្រាកដទេថាចង់លុបសារនេះ?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/chat/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages(
          (prev) =>
            prev?.map((m) =>
              m.id === id ? { ...m, deletedAt: new Date().toISOString() } : m
            ) ?? null
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function clearSelected() {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `តើអ្នកប្រាកដទេថាចង់លុបសារ ${selectedIds.size} ជាអចិន្ត្រៃយ៍? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
      )
    ) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await fetch("/api/admin/chat/messages/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      if (res.ok) {
        setMessages((prev) => prev?.filter((m) => !selectedIds.has(m.id)) ?? null);
        setSelectedIds(new Set());
        setSelectMode(false);
      } else {
        const data = await res.json().catch(() => null);
        onError(data?.error ?? "មិនអាចលុបសារបានទេ។");
      }
    } catch {
      onError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
    } finally {
      setIsClearing(false);
    }
  }

  async function mute(userId: string, minutes: number) {
    const res = await fetch(`/api/admin/chat/users/${userId}/mute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes }),
    });
    if (res.ok) {
      const data = await res.json();
      patchAuthor(userId, { chatMutedUntil: data.chatMutedUntil });
      setMuteTarget(null);
    }
  }

  async function unmute(userId: string) {
    const res = await fetch(`/api/admin/chat/users/${userId}/unmute`, { method: "POST" });
    if (res.ok) patchAuthor(userId, { chatMutedUntil: null });
  }

  async function ban(userId: string) {
    if (!confirm("តើអ្នកប្រាកដទេថាចង់ហាមឃាត់សមាជិកនេះពីការជជែកទាំងស្រុង?")) return;
    const res = await fetch(`/api/admin/chat/users/${userId}/ban`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      patchAuthor(userId, { chatBannedAt: data.chatBannedAt });
    }
  }

  async function unban(userId: string) {
    const res = await fetch(`/api/admin/chat/users/${userId}/unban`, { method: "POST" });
    if (res.ok) patchAuthor(userId, { chatBannedAt: null });
  }

  const flaggedCount = useMemo(
    () => (messages ?? []).filter((m) => m.flagged).length,
    [messages]
  );

  return (
    <div className="khmer-card mx-auto mt-4 max-w-[1600px] rounded-2xl bg-cream-50/60 dark:bg-coffee-800/40">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-heading text-lg font-extrabold text-coffee-900 dark:text-cream-50">
          <MessageCircle size={18} /> ការត្រួតពិនិត្យជជែក · Chat Monitor
          {flaggedCount > 0 && (
            <span className="rounded-full bg-crimson-500 px-2 py-0.5 text-xs font-bold text-white">
              {flaggedCount} 🚩
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {isOpen && (
        <div className="border-t border-coffee-200 px-4 py-3 dark:border-coffee-700">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === "all"
                  ? "bg-coffee-800 text-gold-400"
                  : "bg-coffee-100 text-coffee-600 dark:bg-coffee-900 dark:text-cream-300"
              }`}
            >
              សារទាំងអស់ · All
            </button>
            <button
              type="button"
              onClick={() => setFilter("flagged")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === "flagged"
                  ? "bg-crimson-600 text-white"
                  : "bg-coffee-100 text-coffee-600 dark:bg-coffee-900 dark:text-cream-300"
              }`}
            >
              បានដាក់ទង់ · Flagged 🚩
            </button>

            {isAdminRole && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectMode((v) => !v);
                    setSelectedIds(new Set());
                  }}
                  className={`ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    selectMode
                      ? "bg-coffee-800 text-gold-400"
                      : "bg-coffee-100 text-coffee-600 dark:bg-coffee-900 dark:text-cream-300"
                  }`}
                >
                  {selectMode ? <CheckSquare size={13} /> : <Square size={13} />}
                  ជ្រើសរើស · Select
                </button>
                {selectMode && (
                  <button
                    type="button"
                    onClick={clearSelected}
                    disabled={selectedIds.size === 0 || isClearing}
                    className="flex items-center gap-1 rounded-full bg-crimson-600 px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isClearing ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    លុបជាអចិន្ត្រៃយ៍ ({selectedIds.size})
                  </button>
                )}
              </>
            )}
          </div>

          {messages === null ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              កំពុងផ្ទុក...
            </p>
          ) : messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
              មិនមានសារទេ
            </p>
          ) : (
            <div className="max-h-[600px] space-y-2 overflow-y-auto">
              {messages.map((m) => {
                const muted = isMuted(m.author.chatMutedUntil);
                const banned = !!m.author.chatBannedAt;
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2 rounded-xl border p-3 text-sm ${
                      m.deletedAt
                        ? "border-coffee-200 bg-coffee-50 opacity-60 dark:border-coffee-700 dark:bg-coffee-900"
                        : m.flagged
                          ? "border-crimson-400 bg-crimson-50 dark:border-crimson-600 dark:bg-coffee-900"
                          : "border-coffee-200 bg-white dark:border-coffee-700 dark:bg-coffee-800"
                    }`}
                  >
                    {selectMode && (
                      <button
                        type="button"
                        onClick={() => toggleSelected(m.id)}
                        aria-label="Select message"
                        className="mt-0.5 shrink-0 text-coffee-500 dark:text-cream-300"
                      >
                        {selectedIds.has(m.id) ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => setProfileUserId(m.author.id)}
                        className="flex items-center gap-1.5 font-bold text-coffee-900 hover:underline dark:text-cream-50"
                      >
                        <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-clay-100 dark:bg-coffee-900">
                          {m.author.avatarUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.author.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </span>
                        {m.author.name}
                        <span className="rounded-full bg-coffee-100 px-1.5 py-0.5 text-[10px] font-bold text-coffee-500 dark:bg-coffee-900 dark:text-cream-300">
                          {m.author.role}
                        </span>
                        {muted && (
                          <span className="rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold text-gold-700 dark:bg-coffee-900">
                            🔇 Muted
                          </span>
                        )}
                        {banned && (
                          <span className="rounded-full bg-crimson-100 px-1.5 py-0.5 text-[10px] font-bold text-crimson-700 dark:bg-coffee-900">
                            ⛔ Banned
                          </span>
                        )}
                      </button>
                      <span className="text-[11px] text-coffee-400 dark:text-cream-400">
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-coffee-400 dark:text-cream-400">
                      {m.author.email}
                    </p>

                    {m.deletedAt ? (
                      <p className="mt-1.5 italic text-coffee-400 dark:text-cream-400">
                        [{m.isDeletedByUser ? "សមាជិកលុបខ្លួនឯង" : "បុគ្គលិកលុប"} · {formatDateTime(m.deletedAt)}] {m.text}
                      </p>
                    ) : (
                      <p className="mt-1.5 whitespace-pre-wrap break-words text-coffee-800 dark:text-cream-100">
                        {m.text}
                        {m.editedAt && (
                          <span className="ml-1.5 text-[10px] italic text-coffee-400 dark:text-cream-400">
                            (កែប្រែ · {formatDateTime(m.editedAt)})
                          </span>
                        )}
                      </p>
                    )}
                    {m.originalText && (
                      <p className="mt-1 rounded-lg bg-coffee-100/60 px-2 py-1 text-[11px] italic text-coffee-500 dark:bg-coffee-900/60 dark:text-cream-300">
                        📝 ដើម៖ {m.originalText}
                      </p>
                    )}
                    {m.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.imageUrl}
                        alt=""
                        className="mt-1.5 max-h-32 rounded-lg object-cover"
                        loading="lazy"
                      />
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleFlag(m.id)}
                        disabled={busyId === m.id}
                        className="flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-bold text-gold-700 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 dark:bg-coffee-900"
                      >
                        <Flag size={11} /> {m.flagged ? "ដកទង់ចេញ" : "ដាក់ទង់"}
                      </button>
                      {!m.deletedAt && (
                        <button
                          type="button"
                          onClick={() => deleteMessage(m.id)}
                          disabled={busyId === m.id}
                          className="flex items-center gap-1 rounded-full bg-coffee-100 px-2.5 py-1 text-[11px] font-bold text-crimson-600 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 dark:bg-coffee-900"
                        >
                          <Trash2 size={11} /> លុប
                        </button>
                      )}
                      {isAdminRole && (
                        <>
                          {muted ? (
                            <button
                              type="button"
                              onClick={() => unmute(m.author.id)}
                              className="flex items-center gap-1 rounded-full bg-matcha-100 px-2.5 py-1 text-[11px] font-bold text-matcha-700 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-900"
                            >
                              <Volume2 size={11} /> ដកការស្ងាត់
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setMuteTarget(m.author)}
                              className="flex items-center gap-1 rounded-full bg-coffee-100 px-2.5 py-1 text-[11px] font-bold text-coffee-700 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-900 dark:text-cream-200"
                            >
                              <VolumeX size={11} /> ស្ងាត់
                            </button>
                          )}
                          {banned ? (
                            <button
                              type="button"
                              onClick={() => unban(m.author.id)}
                              className="flex items-center gap-1 rounded-full bg-matcha-100 px-2.5 py-1 text-[11px] font-bold text-matcha-700 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-900"
                            >
                              <ShieldCheck size={11} /> ដករបាំ
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => ban(m.author.id)}
                              className="flex items-center gap-1 rounded-full bg-crimson-100 px-2.5 py-1 text-[11px] font-bold text-crimson-700 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-900"
                            >
                              <Ban size={11} /> ហាមឃាត់
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {profileUserId && (
        <CustomerHistoryModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      {muteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-coffee-900/60 p-4 backdrop-blur-sm">
          <div className="animate-pop-in w-full max-w-xs rounded-2xl bg-cream-50 p-5 shadow-2xl dark:bg-coffee-800">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-heading text-base font-bold text-coffee-900 dark:text-cream-50">
                ស្ងាត់ {muteTarget.name}
              </p>
              <button
                type="button"
                onClick={() => setMuteTarget(null)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full text-coffee-500 hover:bg-coffee-100 dark:hover:bg-coffee-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MUTE_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => mute(muteTarget.id, preset.minutes)}
                  className="rounded-xl border border-coffee-300 py-2.5 text-sm font-semibold text-coffee-700 transition-colors hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
