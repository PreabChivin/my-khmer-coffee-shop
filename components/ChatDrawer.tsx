"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Send, ImagePlus, SmilePlus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useChat } from "@/contexts/ChatContext";
import { CHAT_EMOJIS, type ChatEmoji, type ChatMessageDTO } from "@/lib/types";

const POLL_INTERVAL_MS = 2500;
const TYPING_HEARTBEAT_MS = 2500;
const MAX_TEXT_LENGTH = 500;

const ICEBREAKERS = [
  "សូមអញ្ជើញផឹកកាហ្វេជាមួយគ្នា ☕️",
  "ថ្ងៃនេះអារម្មណ៍យ៉ាងម៉េចដែរ? 🎧",
  "កំពុងផឹកអីថ្ងៃនេះ? 🧋",
  "នរណាចង់បង្កើត Bestie Cart ខ្លះ? 👯",
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Appends `incoming` messages, de-duped by id. Needed because a send's
 *  optimistic append and the next poll tick can race — the tick may have
 *  already been in flight with a stale `after` cursor and independently
 *  fetch the same just-sent message before lastIdRef caught up. */
function mergeMessages(
  prev: ChatMessageDTO[],
  incoming: ChatMessageDTO[]
): ChatMessageDTO[] {
  const seen = new Set(prev.map((m) => m.id));
  const deduped = incoming.filter((m) => !seen.has(m.id));
  return deduped.length ? [...prev, ...deduped] : prev;
}

export default function ChatDrawer() {
  const { user, isStaff } = useSession();
  const { isChatOpen, closeChat } = useChat();

  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string }[]>([]);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageField, setShowImageField] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [openReactionBarFor, setOpenReactionBarFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 🚫 A ban blocks reads too (unlike a mute, which only blocks writes) — set
  // when a poll comes back 403, replacing the whole feed with the reason
  // instead of silently showing an empty room forever.
  const [fatalError, setFatalError] = useState<string | null>(null);

  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const isTyping = text.trim().length > 0;

  // 🔁 Polling loop — the shared feed's "real-time". Only runs while the
  // drawer is open and the member is signed in.
  useEffect(() => {
    if (!isChatOpen || !user) return;
    let cancelled = false;

    async function poll() {
      try {
        const url = lastIdRef.current
          ? `/api/chat/messages?after=${lastIdRef.current}`
          : "/api/chat/messages";
        const res = await fetch(url);
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 403) {
            const body = await res.json().catch(() => null);
            setFatalError(body?.error ?? "អ្នកមិនអាចចូលប្រើការជជែកនេះទេ។");
          }
          return;
        }
        const data = (await res.json()) as {
          messages: ChatMessageDTO[];
          typingUsers: { id: string; name: string }[];
        };
        if (cancelled) return;
        setTypingUsers(data.typingUsers ?? []);
        if (data.messages?.length) {
          setMessages((prev) =>
            lastIdRef.current ? mergeMessages(prev, data.messages) : data.messages
          );
          lastIdRef.current = data.messages[data.messages.length - 1].id;
        }
      } catch {
        // transient network hiccup — next tick retries
      } finally {
        setIsLoadingHistory(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isChatOpen, user]);

  // ⌨️ Typing heartbeat — re-fires on an interval only while actively
  // composing, so a fresh row always exists for others to poll.
  useEffect(() => {
    if (!isTyping || !isChatOpen) return;
    const send = () => fetch("/api/chat/typing", { method: "POST" }).catch(() => {});
    send();
    const interval = setInterval(send, TYPING_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [isTyping, isChatOpen]);

  // ⬇️ Auto-scroll to the newest message, but only if the reader was already
  // near the bottom — never yanks them away from scrollback they're reading.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !shouldAutoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    shouldAutoScrollRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  async function sendMessage(overrideText?: string) {
    const payloadText = (overrideText ?? text).trim();
    const payloadImage = imageUrl.trim() || undefined;
    if (!payloadText && !payloadImage) return;
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: payloadText, imageUrl: payloadImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "មិនអាចផ្ញើសារបានទេ។");
        return;
      }
      shouldAutoScrollRef.current = true;
      setMessages((prev) => mergeMessages(prev, [data as ChatMessageDTO]));
      lastIdRef.current = data.id;
      setText("");
      setImageUrl("");
      setShowImageField(false);
    } catch {
      setError("បណ្តាញមានបញ្ហា សូមព្យាយាមម្តងទៀត។");
    } finally {
      setIsSending(false);
    }
  }

  async function react(messageId: string, emoji: ChatEmoji) {
    setOpenReactionBarFor(null);
    // Optimistic toggle so the tap feels instant.
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        const reactions = existing
          ? m.reactions
              .map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, reactedByMe: false }
                  : r
              )
              .filter((r) => r.count > 0)
          : [
              ...m.reactions.filter((r) => r.emoji !== emoji),
              { emoji, count: 1, reactedByMe: true },
            ];
        return { ...m, reactions };
      })
    );
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const updated = (await res.json()) as ChatMessageDTO;
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      }
    } catch {
      // best-effort — next poll tick will reconcile if this silently failed
    }
  }

  async function deleteMessage(messageId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await fetch(`/api/chat/messages/${messageId}`, { method: "DELETE" });
    } catch {
      // best-effort
    }
  }

  if (!user || !isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-end sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close chat overlay"
        onClick={closeChat}
        className="absolute inset-0 bg-coffee-900/50 backdrop-blur-sm"
      />

      <div className="animate-pop-in relative flex h-[100dvh] w-full flex-col overflow-hidden bg-cream-50 shadow-2xl dark:bg-coffee-900 sm:h-[85vh] sm:max-h-[720px] sm:w-full sm:max-w-md sm:rounded-3xl">
        {/* 🌈 Header — neon-ish gradient, dark-mode-first energy */}
        <div className="relative flex items-center justify-between gap-3 bg-gradient-to-r from-lavender-500 via-crimson-500 to-gold-500 px-4 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Sparkles size={18} />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-base">Café Lounge 💬</p>
              <p className="text-[11px] text-white/80">សន្ទនាសម្រាប់សមាជិកទាំងអស់</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeChat}
            aria-label="Close chat"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform hover:scale-110 hover:bg-white/25 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* 💬 Message feed */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4"
        >
          {fatalError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-coffee-500 dark:text-cream-300">
              <p className="text-3xl">🚫</p>
              <p className="text-sm font-semibold">{fatalError}</p>
            </div>
          ) : isLoadingHistory ? (
            <div className="flex h-full items-center justify-center text-sm text-coffee-500 dark:text-cream-300">
              កំពុងផ្ទុកសារ...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-coffee-500 dark:text-cream-300">
              <p className="text-3xl">🧋</p>
              <p className="text-sm font-semibold">មិនទាន់មានសារនៅឡើយទេ — ចាប់ផ្តើមសន្ទនាមុនគេ!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const isGrouped = prev && prev.author.id === message.author.id;
              return (
                <ChatBubble
                  key={message.id}
                  message={message}
                  showHeader={!isGrouped}
                  canModerate={message.isMine || isStaff}
                  isReactionBarOpen={openReactionBarFor === message.id}
                  onToggleReactionBar={() =>
                    setOpenReactionBarFor((cur) => (cur === message.id ? null : message.id))
                  }
                  onReact={(emoji) => react(message.id, emoji)}
                  onDelete={() => deleteMessage(message.id)}
                />
              );
            })
          )}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-1 text-xs text-coffee-500 dark:text-cream-300">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender-500 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-crimson-500 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-500" />
              </span>
              {typingUsers.map((t) => t.name).join(", ")} កំពុងវាយ...
            </div>
          )}
        </div>

        {!fatalError && (
          <>
            {/* ☕ Icebreakers — quick-fill prompts, hidden once a real conversation exists */}
            {messages.length < 3 && (
              <div className="flex gap-1.5 overflow-x-auto px-3 pb-1.5">
                {ICEBREAKERS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={isSending}
                    className="shrink-0 whitespace-nowrap rounded-full border border-lavender-400/60 bg-lavender-100 px-3 py-1.5 text-xs font-semibold text-lavender-500 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-800 dark:text-lavender-400"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="px-3 pb-1 text-xs font-semibold text-crimson-600 dark:text-crimson-400">
                {error}
              </p>
            )}

            {showImageField && (
              <div className="flex items-center gap-2 px-3 pb-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="ដាក់តំណរូបភាព (https://...)"
                  className="flex-1 rounded-full border border-coffee-300 bg-cream-50 px-3 py-1.5 text-xs outline-none focus:border-lavender-500 dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-50"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setShowImageField(false);
                  }}
                  className="text-xs font-semibold text-coffee-500 dark:text-cream-300"
                >
                  បោះបង់
                </button>
              </div>
            )}

            {/* ✍️ Composer */}
            <div className="flex items-end gap-2 border-t-2 border-gold-500/40 bg-cream-50 p-3 dark:bg-coffee-900">
              <button
                type="button"
                onClick={() => setShowImageField((v) => !v)}
                aria-label="Attach image link"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
                  showImageField
                    ? "bg-lavender-500 text-white"
                    : "bg-coffee-100 text-coffee-700 dark:bg-coffee-800 dark:text-cream-200"
                }`}
              >
                <ImagePlus size={18} />
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
                  placeholder="សរសេរអ្វីមួយ... ✨"
                  className="max-h-24 w-full resize-none rounded-2xl border border-coffee-300 bg-cream-100 px-3.5 py-2.5 text-sm outline-none focus:border-lavender-500 dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-50"
                />
              </div>
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={isSending || (!text.trim() && !imageUrl.trim())}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-lavender-500 to-crimson-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  showHeader,
  canModerate,
  isReactionBarOpen,
  onToggleReactionBar,
  onReact,
  onDelete,
}: {
  message: ChatMessageDTO;
  showHeader: boolean;
  canModerate: boolean;
  isReactionBarOpen: boolean;
  onToggleReactionBar: () => void;
  onReact: (emoji: ChatEmoji) => void;
  onDelete: () => void;
}) {
  const isMine = message.isMine;
  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      {showHeader && (
        <div
          className={`mb-1 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-coffee-500 dark:text-cream-300 ${
            isMine ? "flex-row-reverse" : ""
          }`}
        >
          <span>{message.author.generationEmoji}</span>
          <span>{message.author.name}</span>
          {(message.author.role === "STAFF" || message.author.role === "ADMIN") && (
            <span className="rounded-full bg-matcha-400/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
              Staff
            </span>
          )}
        </div>
      )}

      <div className={`group relative max-w-[78%] ${isMine ? "self-end" : "self-start"}`}>
        <div
          onDoubleClick={() => onReact("❤️")}
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
            {formatTime(message.createdAt)}
          </p>
        </div>

        {/* 🎛️ Hover/tap controls — reaction picker + moderation */}
        <div
          className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${
            isMine ? "right-full mr-1" : "left-full ml-1"
          }`}
        >
          <button
            type="button"
            onClick={onToggleReactionBar}
            aria-label="React"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-coffee-100 text-coffee-600 transition-transform hover:scale-110 active:scale-90 dark:bg-coffee-700 dark:text-cream-200"
          >
            <SmilePlus size={14} />
          </button>
          {canModerate && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete message"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-coffee-100 text-crimson-600 transition-transform hover:scale-110 active:scale-90 dark:bg-coffee-700"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {isReactionBarOpen && (
          <div
            className={`animate-pop-in absolute -top-11 z-10 flex gap-1 rounded-full bg-coffee-900 px-2 py-1.5 shadow-xl dark:bg-coffee-700 ${
              isMine ? "right-0" : "left-0"
            }`}
          >
            {CHAT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className="text-lg transition-transform hover:scale-125 active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {message.reactions.length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onReact(r.emoji)}
                className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold transition-transform hover:scale-105 active:scale-95 ${
                  r.reactedByMe
                    ? "border-lavender-500 bg-lavender-100 text-lavender-500 dark:bg-coffee-800"
                    : "border-coffee-200 bg-white text-coffee-600 dark:border-coffee-600 dark:bg-coffee-800 dark:text-cream-200"
                }`}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
