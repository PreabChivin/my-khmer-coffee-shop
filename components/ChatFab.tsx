"use client";

import { MessageCircle } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useChat } from "@/contexts/ChatContext";

/**
 * 💬 Floating entry point for the Members' Lounge chat — deliberately NOT a
 * 6th icon in the header, since that row is already tuned to fit exactly at
 * 360px-wide phones (see the mobile-header-overflow fix). A fixed bottom
 * corner bubble is also the more recognizable "open chat" affordance anyway.
 *
 * Strictly auth-gated: returns null (not just hidden via CSS) for anyone
 * without a session, so a guest never even gets the DOM node, let alone a
 * route to it.
 */
export default function ChatFab() {
  const { user, isLoading } = useSession();
  const { isChatOpen, openChat } = useChat();

  if (isLoading || !user || isChatOpen) return null;

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Open Café Lounge chat"
      className="glow-ring fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-lavender-500 via-crimson-500 to-gold-500 text-white shadow-[0_8px_24px_-6px_rgba(154,130,234,0.6)] transition-transform hover:scale-110 active:scale-90 sm:bottom-6 sm:right-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-lavender-500/50" />
      <MessageCircle size={24} className="relative" />
    </button>
  );
}
