"use client";

import type { OrderStatus, OrderTimelineStamps, OrderType } from "@/lib/types";

// How far along a status is (index into the 4 stages).
const REACHED: Record<OrderStatus, number> = {
  PENDING: 0,
  AWAITING_VERIFICATION: 0,
  PREPARING: 1,
  READY: 2,
  COMPLETED: 3,
  CANCELLED: -1,
};

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 🚚 Grab/Foodpanda-style 4-stage vertical timeline stepper with per-stage
 * timestamps. Reached stages glow; the active stage pulses; upcoming stages
 * are muted. Cancelled orders show a distinct red terminal state.
 */
export default function OrderTimeline({
  status,
  orderType,
  timeline,
  compact = false,
}: {
  status: OrderStatus;
  orderType: OrderType;
  timeline: OrderTimelineStamps;
  compact?: boolean;
}) {
  const stages = [
    { emoji: "📥", label: "បានទទួលការកម្ម៉ង់", en: "Order Placed", at: timeline.placedAt },
    { emoji: "☕", label: "កំពុងរៀបចំ/ឆុង", en: "Preparing", at: timeline.preparingAt },
    {
      emoji: orderType === "Delivery" ? "🛵" : "🛍️",
      label: orderType === "Delivery" ? "កំពុងដឹក" : "រួចរាល់ មកយកបាន",
      en: orderType === "Delivery" ? "In Delivery" : "Ready",
      at: timeline.readyAt,
    },
    { emoji: "✅", label: "បានបញ្ចប់", en: "Completed", at: timeline.completedAt },
  ];

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-crimson-300 bg-crimson-50 px-4 py-3 dark:border-crimson-700 dark:bg-coffee-900">
        <span className="text-2xl">🥺</span>
        <div>
          <p className="text-sm font-extrabold text-crimson-600 dark:text-crimson-400">
            ការកម្ម៉ង់ត្រូវបានបោះបង់ · Cancelled
          </p>
          <p className="text-[11px] text-coffee-500 dark:text-cream-300">
            បានទទួល {formatTime(timeline.placedAt)}
          </p>
        </div>
      </div>
    );
  }

  const reached = REACHED[status];
  const nodeSize = compact ? "h-8 w-8 text-base" : "h-11 w-11 text-xl";

  return (
    <ol className="w-full">
      {stages.map((stage, i) => {
        const isDone = i < reached || (i === reached && status === "COMPLETED");
        const isActive = i === reached && status !== "COMPLETED";
        const isReached = isDone || isActive;
        const isLast = i === stages.length - 1;
        const time = formatTime(stage.at);

        return (
          <li key={i} className="flex gap-3">
            {/* Node + connector rail */}
            <div className="flex flex-col items-center">
              <span
                className={`flex ${nodeSize} shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? "border-matcha-500 bg-matcha-500 text-white shadow"
                    : isActive
                      ? "animate-urgent-pulse border-gold-500 bg-gold-100 text-gold-700"
                      : "border-coffee-200 bg-cream-100 text-coffee-300 dark:border-coffee-700 dark:bg-coffee-800 dark:text-coffee-500"
                }`}
              >
                {isDone ? "✓" : stage.emoji}
              </span>
              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${compact ? "min-h-[1.25rem]" : "min-h-[1.75rem]"} ${
                    i < reached ? "bg-matcha-500" : "bg-coffee-200 dark:bg-coffee-700"
                  }`}
                />
              )}
            </div>

            {/* Label + timestamp */}
            <div className={`min-w-0 flex-1 ${isLast ? "" : compact ? "pb-3" : "pb-5"}`}>
              <p
                className={`font-heading ${compact ? "text-sm" : "text-base"} font-bold leading-tight ${
                  isReached
                    ? "text-coffee-900 dark:text-cream-50"
                    : "text-coffee-400 dark:text-cream-400"
                }`}
              >
                {stage.emoji} {stage.label}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                {time ? (
                  <span className="rounded-full bg-clay-100 px-2 py-0.5 text-[11px] font-bold text-clay-600 dark:bg-coffee-900 dark:text-clay-400">
                    🕒 {time}
                  </span>
                ) : (
                  <span className="text-[11px] text-coffee-300 dark:text-coffee-500">
                    {isActive ? "កំពុងដំណើរការ..." : "រង់ចាំ..."}
                  </span>
                )}
                {isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gold-600">
                    ● Now
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
