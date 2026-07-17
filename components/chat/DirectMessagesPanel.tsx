"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import {
  ArrowLeft,
  Send,
  ImagePlus,
  Sticker as StickerIcon,
  Trash2,
  Pencil,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { compressImageToDataUrl } from "@/lib/imageCompress";
import { STICKERS, getSticker } from "@/lib/stickers";
import { formatTime, dayKey, formatDateSeparator } from "@/lib/chatDateGroups";
import type { DirectConversationSummaryDTO, DirectMessageDTO } from "@/lib/types";

const POLL_INTERVAL_MS = 2500;
const MAX_TEXT_LENGTH = 500;

function mergeMessages(
  prev: DirectMessageDTO[],
  incoming: DirectMessageDTO[]
): DirectMessageDTO[] {
  const seen = new Set(prev.map((m) => m.id));
  const deduped = incoming.filter((m) => !seen.has(m.id));
  return deduped.length ? [...prev, ...deduped] : prev;
}

/** Relative-ish timestamp for the conversation list row ("2:30 PM" today,
 *  otherwise the date-separator label — same vocabulary as the thread). */
function listTimestamp(iso: string): string {
  return dayKey(iso) === dayKey(new Date().toISOString()) ? formatTime(iso) : formatDateSeparator(iso);
}

/**
 * 💬 Private 1-on-1 messaging — a sibling overlay to ChatGameOverlay, filling
 * the Café Lounge drawer while open. Two internal views:
 *   - "list": every conversation the member participates in ("Active Private
 *     Chats"), most-recent first.
 *   - "thread": one conversation's message history + composer.
 * When `initialTarget` is set (opened by tapping a room-chat message's
 * author), it skips straight to that person's thread instead of the list.
 */
export default function DirectMessagesPanel({
  initialTarget,
  onClose,
}: {
  initialTarget: { id: string; name: string } | null;
  onClose: () => void;
}) {
  // Deliberately starts as "list" even when initialTarget is set — the
  // start-or-get fetch is async, and flipping straight to "thread" before
  // activeConversation exists would render the thread UI with nothing to
  // show (empty header, no peer name). Staying on "list" lets the
  // isStartingThread spinner below own that loading window instead; the
  // effect flips to "thread" only once the conversation is actually ready.
  const [view, setView] = useState<"list" | "thread">("list");
  const [conversations, setConversations] = useState<DirectConversationSummaryDTO[] | null>(null);
  const [activeConversation, setActiveConversation] = useState<DirectConversationSummaryDTO | null>(
    null
  );
  const [messages, setMessages] = useState<DirectMessageDTO[]>([]);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isStartingThread, setIsStartingThread] = useState(Boolean(initialTarget));
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🚀 Kick off from a specific target (tapped from the room chat) — start or
  // fetch the thread with that person, then load its history.
  useEffect(() => {
    if (!initialTarget) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: initialTarget.id }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "មិនអាចបើកការជជែកឯកជនបានទេ។");
          setIsStartingThread(false);
          return;
        }
        setActiveConversation(data as DirectConversationSummaryDTO);
        setView("thread");
      } catch {
        if (!cancelled) setError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
      } finally {
        if (!cancelled) setIsStartingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📋 Load the conversation list whenever we're showing it — but not while
  // an initialTarget's start-or-get fetch is still in flight, since that
  // will immediately navigate away to "thread" anyway.
  useEffect(() => {
    if (view !== "list" || isStartingThread) return;
    let cancelled = false;
    fetch("/api/chat/direct")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { conversations: DirectConversationSummaryDTO[] }) => {
        if (!cancelled) setConversations(data.conversations);
      })
      .catch(() => {
        if (!cancelled) setError("មិនអាចផ្ទុកបញ្ជីជជែកបានទេ។");
      });
    return () => {
      cancelled = true;
    };
  }, [view, isStartingThread]);

  // 🔁 Poll the active thread while it's open.
  useEffect(() => {
    if (view !== "thread" || !activeConversation) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function poll(isInitial: boolean) {
      if (isInitial) setIsLoadingThread(true);
      try {
        const url = lastIdRef.current
          ? `/api/chat/direct/${activeConversation!.id}/messages?after=${lastIdRef.current}`
          : `/api/chat/direct/${activeConversation!.id}/messages`;
        const res = await fetch(url);
        if (cancelled) return;
        if (!res.ok) {
          if (isInitial) setError("មិនអាចផ្ទុកសារបានទេ។");
          return;
        }
        const data = (await res.json()) as { messages: DirectMessageDTO[] };
        if (cancelled) return;
        if (data.messages.length > 0) {
          lastIdRef.current = data.messages[data.messages.length - 1].id;
        }
        setMessages((prev) => mergeMessages(prev, data.messages));
      } catch {
        // transient — next tick retries
      } finally {
        if (isInitial) setIsLoadingThread(false);
      }
    }

    poll(true);
    interval = setInterval(() => poll(false), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [view, activeConversation]);

  // ⬇️ Auto-scroll to the newest message.
  useEffect(() => {
    if (view === "thread" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  function openThread(conversation: DirectConversationSummaryDTO) {
    setMessages([]);
    lastIdRef.current = null;
    setActiveConversation(conversation);
    setView("thread");
  }

  function backToList() {
    setView("list");
    setActiveConversation(null);
    setMessages([]);
    lastIdRef.current = null;
    setText("");
    setImageUrl("");
    setShowStickerDrawer(false);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageBusy(true);
    setError(null);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "";
      setError(
        reason === "too-large"
          ? "រូបភាពធំពេក (អតិបរមា 5MB)។"
          : reason === "not-an-image"
            ? "សូមជ្រើសរើសឯកសាររូបភាព។"
            : "មិនអាចដំណើរការរូបភាពនេះបានទេ។"
      );
    } finally {
      setImageBusy(false);
    }
  }

  async function sendMessage() {
    if (!activeConversation) return;
    const trimmed = text.trim();
    if (!trimmed && !imageUrl) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/direct/${activeConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, imageUrl: imageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "មិនអាចផ្ញើសារបានទេ។");
        return;
      }
      setMessages((prev) => mergeMessages(prev, [data as DirectMessageDTO]));
      lastIdRef.current = data.id;
      setText("");
      setImageUrl("");
    } catch {
      setError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
    } finally {
      setIsSending(false);
    }
  }

  async function sendSticker(stickerId: string) {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/chat/direct/${activeConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stickerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "មិនអាចផ្ញើស្ទីខឺបានទេ។");
        return;
      }
      setMessages((prev) => mergeMessages(prev, [data as DirectMessageDTO]));
      lastIdRef.current = data.id;
      setShowStickerDrawer(false);
    } catch {
      setError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
    }
  }

  async function deleteMessage(messageId: string) {
    if (!activeConversation) return;
    try {
      const res = await fetch(`/api/chat/direct/${activeConversation.id}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch {
      // best-effort
    }
  }

  async function editMessage(messageId: string, newText: string): Promise<boolean> {
    if (!activeConversation) return false;
    try {
      const res = await fetch(`/api/chat/direct/${activeConversation.id}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "មិនអាចកែសារបានទេ។");
        return false;
      }
      setMessages((prev) => prev.map((m) => (m.id === messageId ? (data as DirectMessageDTO) : m)));
      return true;
    } catch {
      setError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
      return false;
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-cream-50 dark:bg-coffee-900">
      <div className="flex items-center gap-2 bg-gradient-to-r from-lavender-500 via-crimson-500 to-gold-500 px-4 py-3.5 text-white">
        {view === "thread" ? (
          <button
            type="button"
            onClick={backToList}
            aria-label="Back to conversation list"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform hover:scale-110 hover:bg-white/25 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-heading text-base">
            {view === "thread" && activeConversation
              ? activeConversation.peer.name
              : "សារឯកជន · Private Chats"}
          </p>
          <p className="truncate text-[11px] text-white/80">
            {view === "thread" ? "ជជែកឯកជនរវាងអ្នកទាំងពីរ" : "ការជជែកសកម្មរបស់អ្នក"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close private messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-transform hover:scale-110 hover:bg-white/25 active:scale-95"
        >
          <X size={18} />
        </button>
      </div>

      {view === "list" ? (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {error && !isStartingThread && (
            <p className="mb-2 px-1 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
              {error}
            </p>
          )}
          {isStartingThread ? (
            <div className="flex h-full items-center justify-center text-sm text-coffee-500 dark:text-cream-300">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : conversations === null ? (
            <p className="py-8 text-center text-sm text-coffee-400 dark:text-cream-400">
              កំពុងផ្ទុក...
            </p>
          ) : conversations.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
              <p className="text-3xl">💌</p>
              <p className="text-sm font-semibold text-coffee-500 dark:text-cream-300">
                មិនទាន់មានការជជែកឯកជនទេ
              </p>
              <p className="text-xs text-coffee-400 dark:text-cream-400">
                ចុចលើឈ្មោះសមាជិកនៅក្នុង Café Lounge ដើម្បីផ្ញើសារឯកជន
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openThread(c)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors hover:bg-coffee-100 dark:hover:bg-coffee-800"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay-100 text-lg dark:bg-coffee-800">
                      {c.peer.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.peer.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        c.peer.generationEmoji
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-coffee-900 dark:text-cream-50">
                          {c.peer.name}
                        </span>
                        {c.lastMessage && (
                          <span className="shrink-0 text-[10px] text-coffee-400 dark:text-cream-400">
                            {listTimestamp(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-coffee-500 dark:text-cream-300">
                        {c.lastMessage
                          ? c.lastMessage.kind === "STICKER"
                            ? `${c.lastMessage.isMine ? "អ្នក: " : ""}${getSticker(c.lastMessage.text)?.emoji ?? "💌"}`
                            : `${c.lastMessage.isMine ? "អ្នក: " : ""}${c.lastMessage.text || "🖼️ រូបភាព"}`
                          : "ចាប់ផ្តើមជជែក..."}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4"
          >
            {isLoadingThread ? (
              <div className="flex h-full items-center justify-center text-sm text-coffee-500 dark:text-cream-300">
                កំពុងផ្ទុកសារ...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
                <p className="text-3xl">👋</p>
                <p className="text-sm text-coffee-400 dark:text-cream-400">
                  ចាប់ផ្តើមសន្ទនាជាមួយ {activeConversation?.peer.name}
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const prev = messages[index - 1];
                const showDateSeparator = !prev || dayKey(prev.createdAt) !== dayKey(message.createdAt);
                return (
                  <Fragment key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center py-1">
                        <span className="rounded-full bg-coffee-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-coffee-500 dark:bg-coffee-800 dark:text-cream-300">
                          {formatDateSeparator(message.createdAt)}
                        </span>
                      </div>
                    )}
                    <DirectMessageBubble
                      message={message}
                      onDelete={() => deleteMessage(message.id)}
                      onEdit={(newText) => editMessage(message.id, newText)}
                    />
                  </Fragment>
                );
              })
            )}
          </div>

          {error && (
            <p className="px-3 pb-1 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
              {error}
            </p>
          )}

          {imageUrl && (
            <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-coffee-100 p-2 dark:bg-coffee-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="ml-auto text-xs font-bold text-crimson-600"
              >
                យកចេញ
              </button>
            </div>
          )}

          {showStickerDrawer && (
            <div className="mx-3 mb-2 grid animate-pop-in grid-cols-6 gap-1.5 rounded-2xl border border-lavender-400/60 bg-lavender-50 p-3 dark:border-coffee-600 dark:bg-coffee-800">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => sendSticker(sticker.id)}
                  title={sticker.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition-transform hover:scale-125 active:scale-90"
                >
                  {sticker.emoji}
                </button>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
          <div className="flex items-end gap-2 border-t-2 border-gold-500/40 bg-cream-50 p-3 dark:bg-coffee-900">
            <button
              type="button"
              onClick={() => setShowStickerDrawer((v) => !v)}
              aria-label="Send a sticker"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
                showStickerDrawer
                  ? "bg-lavender-500 text-white"
                  : "bg-coffee-100 text-coffee-700 dark:bg-coffee-800 dark:text-cream-200"
              }`}
            >
              <StickerIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageBusy}
              aria-label="Attach image"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 ${
                imageUrl
                  ? "bg-lavender-500 text-white"
                  : "bg-coffee-100 text-coffee-700 dark:bg-coffee-800 dark:text-cream-200"
              }`}
            >
              {imageBusy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            </button>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="សរសេរសារឯកជន... 💌"
                className="max-h-24 w-full resize-none rounded-2xl border border-coffee-300 bg-cream-100 px-3.5 py-2.5 text-sm outline-none focus:border-lavender-500 dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-50"
              />
            </div>
            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending || imageBusy || (!text.trim() && !imageUrl.trim())}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DirectMessageBubble({
  message,
  onDelete,
  onEdit,
}: {
  message: DirectMessageDTO;
  onDelete: () => void;
  onEdit: (newText: string) => Promise<boolean>;
}) {
  const isMine = message.isMine;
  const isSticker = message.kind === "STICKER";
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.text);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function saveEdit() {
    const trimmed = editDraft.trim();
    if (!trimmed || trimmed === message.text) {
      setIsEditing(false);
      return;
    }
    setIsSavingEdit(true);
    const ok = await onEdit(trimmed);
    setIsSavingEdit(false);
    if (ok) setIsEditing(false);
  }

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      <div className={`group relative max-w-[78%] ${isMine ? "self-end" : "self-start"}`}>
        {isEditing ? (
          <div className="animate-bubble-in w-64 max-w-full rounded-2xl border-2 border-lavender-400 bg-white p-2.5 shadow-sm dark:bg-coffee-800">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_TEXT_LENGTH))}
              autoFocus
              rows={2}
              className="w-full resize-none rounded-lg border border-coffee-200 bg-cream-50 px-2 py-1.5 text-sm outline-none focus:border-lavender-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
            />
            <div className="mt-1.5 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditDraft(message.text);
                  setIsEditing(false);
                }}
                disabled={isSavingEdit}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold text-coffee-500 hover:bg-coffee-100 disabled:opacity-50 dark:text-cream-300 dark:hover:bg-coffee-700"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-1 rounded-full bg-lavender-500 px-2.5 py-1 text-[11px] font-bold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSavingEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                រក្សាទុក
              </button>
            </div>
          </div>
        ) : isSticker ? (
          <div className="animate-bubble-in select-none text-6xl leading-none" title={getSticker(message.text)?.label}>
            {getSticker(message.text)?.emoji ?? "❔"}
          </div>
        ) : (
          <div
            className={`animate-bubble-in select-none rounded-2xl px-3.5 py-2.5 text-sm shadow-sm transition-transform active:scale-[0.98] ${
              isMine
                ? "rounded-br-md bg-gradient-to-br from-lavender-500 to-crimson-500 text-white"
                : "rounded-bl-md bg-white text-coffee-900 dark:bg-coffee-800 dark:text-cream-50"
            }`}
          >
            {message.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.imageUrl}
                alt=""
                className="mb-1.5 max-h-56 w-full rounded-xl object-cover"
                loading="lazy"
              />
            )}
            {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
            <p
              className={`mt-1 text-right text-[10px] ${
                isMine ? "text-white/70" : "text-coffee-400 dark:text-cream-400"
              }`}
            >
              {message.isEdited && <span className="mr-1 italic opacity-80">កែប្រែ</span>}
              {formatTime(message.createdAt)}
            </p>
          </div>
        )}

        {isMine && !isEditing && (
          <div className="absolute right-full top-1/2 mr-1 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {message.kind === "TEXT" && (
              <button
                type="button"
                onClick={() => {
                  setEditDraft(message.text);
                  setIsEditing(true);
                }}
                aria-label="Edit message"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-coffee-100 text-coffee-600 transition-transform hover:scale-110 active:scale-90 dark:bg-coffee-700 dark:text-cream-200"
              >
                <Pencil size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete message"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-coffee-100 text-crimson-600 transition-transform hover:scale-110 active:scale-90 dark:bg-coffee-700"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
