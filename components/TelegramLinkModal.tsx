"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { normalizePhone } from "@/lib/loyalty";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

/** 🔔 Pre-order Telegram linking — lets a customer connect Telegram from the
 *  Header, before they've ever placed an order. Keyed by phone number (the
 *  "p_" prefix tells the webhook this is a LoyaltyAccount link, not an
 *  Order id) so every future order they place with that same phone number
 *  is automatically notified with no per-order re-linking. */
export default function TelegramLinkModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState("");

  const normalized = normalizePhone(phone);
  const isValid = normalized.length >= 8;
  const deepLink = isValid ? `https://t.me/${TELEGRAM_BOT_USERNAME}?start=p_${normalized}` : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-card relative w-full max-w-xs rounded-3xl bg-cream-50 p-6 dark:bg-coffee-800">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clay-100 text-clay-500 dark:bg-coffee-900">
            <Bell size={22} />
          </span>
          <p className="mt-3 font-heading text-base text-coffee-900 dark:text-cream-50">
            🔔 ទទួលដំណឹងតាម Telegram
          </p>
          <p className="mt-1 text-xs leading-relaxed text-coffee-500 dark:text-cream-300">
            បញ្ចូលលេខទូរស័ព្ទរបស់អ្នក ដើម្បីភ្ជាប់ Telegram ជាមុន — រាល់ការកម្ម៉ង់លើកក្រោយនឹងជូនដំណឹងស្វ័យប្រវត្តិណា៎ Bestie! ☕️✨
          </p>
        </div>

        <input
          autoFocus
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="012 345 678"
          className="mt-4 w-full rounded-xl border border-coffee-300 bg-cream-50 px-4 py-2.5 text-center text-coffee-900 outline-none focus:border-gold-500 dark:border-coffee-600 dark:bg-coffee-900 dark:text-cream-50"
        />

        {deepLink ? (
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Bell size={16} />
            បន្តទៅ Telegram
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-full bg-coffee-200 py-2.5 font-bold text-coffee-400 dark:bg-coffee-700 dark:text-cream-400"
          >
            បន្តទៅ Telegram
          </button>
        )}
      </div>
    </div>
  );
}
