"use client";

import { useEffect, useMemo, useState } from "react";
import { Bike, MapPin, Store, Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { OrderStatus, OrderTimelineStamps, OrderType } from "@/lib/types";

// Compact route: cafe pin (start) → curved dashed road → home pin (end).
const VIEWBOX = { w: 300, h: 140 };
const START = { x: 30, y: 108 };
const CONTROL = { x: 150, y: 14 };
const END = { x: 270, y: 46 };

function bezierPoint(t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * START.x + 2 * mt * t * CONTROL.x + t * t * END.x,
    y: mt * mt * START.y + 2 * mt * t * CONTROL.y + t * t * END.y,
  };
}

/** Deterministic per-order pseudo-random seed so the simulated distance/ETA
 *  stay stable across polls instead of jumping around on every re-render. */
function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * 🛵 Foodpanda/WOWNOW-style live delivery card — a compact, stylized route
 * (not a real geocoded map, since no mapping API key is configured) showing
 * a rider gliding from the cafe to the customer, with a live distance stat
 * and a smoothly counting-down ETA. Only meaningful for Delivery orders.
 */
export default function DeliveryTrackingMap({
  orderId,
  orderType,
  status,
  timeline,
}: {
  orderId: string;
  orderType: OrderType;
  status: OrderStatus;
  timeline: OrderTimelineStamps;
}) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { distanceKm, totalEtaMin } = useMemo(() => {
    const seed = seedFromId(orderId);
    const distanceKm = 1.2 + (seed % 340) / 100; // ~1.2 – 4.6 km
    const totalEtaMin = Math.round(6 + distanceKm * 4); // ~11 – 24 min
    return { distanceKm, totalEtaMin };
  }, [orderId]);

  if (orderType !== "Delivery" || status === "COMPLETED" || status === "CANCELLED") {
    return null;
  }

  const inDelivery = status === "READY";
  const elapsedMin = inDelivery && timeline.readyAt
    ? (now - new Date(timeline.readyAt).getTime()) / 60000
    : 0;
  const progress = inDelivery ? Math.min(1, Math.max(0, elapsedMin / totalEtaMin)) : 0;
  const remainingMin = inDelivery
    ? Math.max(1, Math.ceil(totalEtaMin - elapsedMin))
    : totalEtaMin;
  const arriving = inDelivery && progress >= 0.96;

  const vehicle = bezierPoint(progress);
  const vLeft = `${(vehicle.x / VIEWBOX.w) * 100}%`;
  const vTop = `${(vehicle.y / VIEWBOX.h) * 100}%`;

  const statusNote = arriving
    ? t("trackMap.arriving")
    : inDelivery
      ? t("trackMap.onTheWay")
      : t("trackMap.packing");

  return (
    <div className="mt-4 w-full rounded-3xl border-2 border-clay-400 bg-gradient-to-b from-cream-100 to-clay-50 px-4 py-4 dark:from-coffee-800 dark:to-coffee-900">
      <div className="mb-3 flex items-center gap-2">
        <Bike size={18} className={inDelivery ? "text-clay-600" : "text-coffee-400"} />
        <p className="font-heading text-base font-extrabold text-coffee-900 dark:text-cream-50">
          {t("trackMap.title")}
        </p>
      </div>

      {/* Route illustration */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-white/60 dark:bg-coffee-900/60">
        <svg
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          className="aspect-[300/140] w-full"
          preserveAspectRatio="none"
        >
          <path
            d={`M ${START.x} ${START.y} Q ${CONTROL.x} ${CONTROL.y} ${END.x} ${END.y}`}
            fill="none"
            stroke="var(--color-clay-400)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 6"
            className={inDelivery ? "animate-road-dash opacity-90" : "opacity-40"}
          />
        </svg>

        {/* Cafe pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${(START.x / VIEWBOX.w) * 100}%`, top: `${(START.y / VIEWBOX.h) * 100}%` }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-coffee-500 bg-coffee-50 text-coffee-700 shadow dark:bg-coffee-900 dark:text-cream-100">
            <Store size={13} />
          </span>
        </div>

        {/* Home pin */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${(END.x / VIEWBOX.w) * 100}%`, top: `${(END.y / VIEWBOX.h) * 100}%` }}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-crimson-500 bg-crimson-50 text-crimson-600 shadow dark:bg-coffee-900 dark:text-crimson-300">
            <MapPin size={13} />
          </span>
        </div>

        {/* Rider */}
        {inDelivery && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-[900ms] ease-linear"
            style={{ left: vLeft, top: vTop }}
          >
            <span className="animate-scooter-bob flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold-500 bg-gold-100 text-gold-700 shadow-lg dark:bg-coffee-900 dark:text-gold-400">
              <Bike size={16} />
            </span>
          </div>
        )}
      </div>

      {/* Distance + ETA stat chips */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-coffee-900/60">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
            <MapPin size={11} /> {t("trackMap.distanceLabel")}
          </p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-coffee-900 dark:text-cream-50">
            {distanceKm.toFixed(1)} {t("trackMap.kmShort")}
          </p>
        </div>
        <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-coffee-900/60">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-coffee-400 dark:text-cream-400">
            <Timer size={11} /> {t("trackMap.etaLabel")}
          </p>
          <p className="mt-0.5 text-lg font-extrabold tabular-nums text-coffee-900 dark:text-cream-50">
            {arriving ? "~1" : remainingMin} {t("trackMap.minutesShort")}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-center text-xs font-semibold text-coffee-600 dark:text-cream-300">
        {statusNote}
      </p>
    </div>
  );
}
