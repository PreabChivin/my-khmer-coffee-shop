"use client";

import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useLanguage } from "@/contexts/LanguageContext";

/** 💬 Thin landing page for the Social Lounge — the real chat lives in the
 *  always-available `ChatFab`/`ChatDrawer` overlay (reused, not rebuilt);
 *  this route exists purely so "Social Lounge" has a real link target from
 *  nav instead of only being reachable via the floating button. Opens the
 *  drawer automatically on load. */
export default function SocialPage() {
  const { openChat } = useChat();
  const { lang } = useLanguage();
  const km = lang === "km";

  useEffect(() => {
    openChat();
  }, [openChat]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
      <span className="animate-bounce-cute text-6xl">💬</span>
      <h1 className="font-heading text-xl font-extrabold text-coffee-900 dark:text-cream-50">
        Social Lounge
      </h1>
      <p className="text-sm text-coffee-500 dark:text-cream-300">
        {km
          ? "ជជែក ផ្ញើស្ទីខឺ និងអញ្ជើញមិត្តភក្តិមកប្រកួតហ្គេម"
          : "Chat, send stickers, and invite friends to a game"}
      </p>
      <button
        type="button"
        onClick={openChat}
        className="btn-tactile flex items-center gap-2 rounded-full bg-gradient-to-r from-lavender-500 via-crimson-500 to-gold-500 px-6 py-3 text-sm font-extrabold text-white shadow-md transition-transform hover:scale-105"
      >
        <MessageCircle size={16} /> {km ? "បើក Social Lounge" : "Open Social Lounge"}
      </button>
    </div>
  );
}
