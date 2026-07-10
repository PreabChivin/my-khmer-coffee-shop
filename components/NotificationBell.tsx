"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Gift } from "lucide-react";
import { useCustomerSession } from "@/contexts/CustomerSessionContext";
import { useAuthModal } from "@/contexts/AuthModalContext";
import type { OrderHistoryItemDTO, OrderStatus } from "@/lib/types";

const SEEN_KEY = "cafe-notif-seen";
const POLL_MS = 60000;

const STATUS_ALERT: Record<OrderStatus, { emoji: string; text: string }> = {
  PENDING: { emoji: "⏳", text: "កំពុងរង់ចាំការទូទាត់" },
  AWAITING_VERIFICATION: { emoji: "👀", text: "កំពុងផ្ទៀងផ្ទាត់ការទូទាត់" },
  PREPARING: { emoji: "☕", text: "កំពុងឆុងដោយស្នេហ៍!" },
  READY: { emoji: "🛵", text: "រួចរាល់ហើយ មកយកបាន!" },
  COMPLETED: { emoji: "✅", text: "បានបញ្ចប់ — អរគុណ Bestie!" },
  CANCELLED: { emoji: "🥺", text: "ត្រូវបានបោះបង់ចោល" },
};

interface Alert {
  id: string;
  emoji: string;
  title: string;
  ts: number;
}

export default function NotificationBell() {
  const { user } = useCustomerSession();
  const { openAuth } = useAuthModal();
  const [orders, setOrders] = useState<OrderHistoryItemDTO[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load the last-seen marker once on mount (deferred to an effect so it stays
  // hydration-safe — localStorage isn't available during SSR).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastSeen(Number(window.localStorage.getItem(SEEN_KEY)) || 0);
    } catch {
      // ignore
    }
  }, []);

  // Poll the customer's orders while signed in (order status = notifications).
  useEffect(() => {
    if (!user) return; // logged-out: unread is force-zeroed below
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/orders/mine");
        if (!res.ok) return;
        const data: OrderHistoryItemDTO[] = await res.json();
        if (!cancelled) setOrders(data);
      } catch {
        // transient — next tick retries
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user]);

  // Close the panel on an outside click.
  useEffect(() => {
    if (!isOpen) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  const alerts = useMemo<Alert[]>(() => {
    return orders
      .map((o) => {
        const s = STATUS_ALERT[o.orderStatus];
        return {
          id: o.id,
          emoji: s.emoji,
          title: `ការកម្ម៉ង់ #${o.id.slice(0, 8).toUpperCase()} — ${s.text}`,
          ts: new Date(o.updatedAt).getTime(),
        };
      })
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10);
  }, [orders]);

  const unread = useMemo(
    () => (user ? alerts.filter((a) => a.ts > lastSeen).length : 0),
    [user, alerts, lastSeen]
  );

  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      // Opening marks everything read.
      const now = Date.now();
      setLastSeen(now);
      try {
        window.localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="ការជូនដំណឹង / Notifications"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-transform hover:scale-110 hover:bg-coffee-100 active:scale-95 dark:text-cream-100 dark:hover:bg-coffee-800"
      >
        <Bell size={20} className={unread > 0 ? "animate-wiggle" : ""} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-crimson-500 px-1 text-[11px] font-bold text-white shadow ring-2 ring-cream-50 dark:ring-coffee-900">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="animate-pop-in absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-gold-500/50 bg-cream-50 shadow-xl dark:bg-coffee-800">
          <div className="border-b border-coffee-100 px-4 py-3 dark:border-coffee-700">
            <p className="font-heading text-sm font-extrabold text-coffee-900 dark:text-cream-50">
              🔔 ការជូនដំណឹង
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {!user ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-coffee-500 dark:text-cream-300">
                  ចូលគណនីដើម្បីទទួលការជូនដំណឹងអំពីការកម្ម៉ង់ 💖
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openAuth();
                  }}
                  className="mt-3 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-5 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                >
                  ចូល / ចុះឈ្មោះ
                </button>
              </div>
            ) : alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-coffee-400 dark:text-cream-400">
                គ្មានការជូនដំណឹងថ្មីទេ 🌈
              </p>
            ) : (
              <ul>
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Link
                      href="/orders"
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-2.5 border-b border-coffee-100 px-4 py-3 transition-colors hover:bg-clay-50 dark:border-coffee-700 dark:hover:bg-coffee-900"
                    >
                      <span className="text-lg">{a.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-snug text-coffee-800 dark:text-cream-100">
                          {a.title}
                        </p>
                        <p className="text-[10px] text-coffee-400 dark:text-cream-400">
                          {new Date(a.ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {/* Standing loyalty promo — informational, never counted as unread */}
            <Link
              href={user ? "/account" : "/"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 bg-gradient-to-r from-gold-50 to-clay-50 px-4 py-3 dark:from-coffee-900 dark:to-coffee-900"
            >
              <Gift size={16} className="shrink-0 text-crimson-500" />
              <p className="text-[11px] font-semibold leading-snug text-coffee-700 dark:text-cream-200">
                🎁 សន្សំពិន្ទុរាល់ការកម្ម៉ង់ + ចាប់រង្វាន់ប្រចាំខែតាមកម្រិត Tier!
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
