"use client";

import { MessageCircle, Gamepad2, Sticker as StickerIcon } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useChat } from "@/contexts/ChatContext";

/**
 * 💬 Home-dashboard entry point into the Café Lounge — a creative,
 * high-visibility invite card (distinct from the always-on ChatFab, which
 * stays as the quick-access bubble everywhere else). Strictly auth-gated
 * like ChatFab: returns null for guests, never even mounting the DOM node.
 */
export default function CafeLoungeBanner() {
  const { user, isLoading, isStaff } = useSession();
  const { openChat } = useChat();

  if (isLoading || !user || isStaff) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <button
        type="button"
        onClick={openChat}
        className="btn-tactile group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-lavender-500 via-crimson-500 to-gold-500 p-4 text-left shadow-lg sm:p-5"
      >
        <span className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <span className="glow-ring flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl backdrop-blur-sm">
          <span className="animate-wiggle">💬</span>
        </span>
        <div className="min-w-0 flex-1 text-white">
          <p className="font-heading text-lg font-extrabold drop-shadow-sm">
            Café Lounge ✨ ជជែកលេង
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-white/90">
            <span className="flex items-center gap-1">
              <Gamepad2 size={13} /> ហ្គេម
            </span>
            <span className="flex items-center gap-1">
              <StickerIcon size={13} /> ស្ទីខឺ
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} /> ជជែកផ្ទាល់
            </span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/25 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-transform group-hover:scale-105">
          ចូលរួម →
        </span>
      </button>
    </div>
  );
}
