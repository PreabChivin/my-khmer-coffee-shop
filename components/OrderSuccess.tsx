"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bike,
  Coffee,
  PackageCheck,
  ScrollText,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import KhmerDivider from "@/components/KhmerDivider";
import SayingBlock from "@/components/SayingBlock";
import { CULTURAL } from "@/lib/i18n";
import type {
  OrderStatus,
  OrderStatusResponseBody,
  OrderType,
} from "@/lib/types";

const POLL_INTERVAL_MS = 4000;

/**
 * Maps an order's lifecycle status to a position in the 3-phase customer
 * tracker: 0 = received, 1 = brewing, 2 = ready. COMPLETED collapses onto the
 * final phase; CANCELLED is handled separately.
 */
function statusToPhase(status: OrderStatus): number {
  switch (status) {
    case "PENDING":
    case "AWAITING_VERIFICATION":
      return 0;
    case "PREPARING":
      return 1;
    case "READY":
    case "COMPLETED":
      return 2;
    default:
      return 0;
  }
}

export default function OrderSuccess({
  orderId,
  orderType,
}: {
  orderId: string;
  orderType: OrderType;
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<OrderStatus>("PREPARING");
  const statusRef = useRef<OrderStatus>("PREPARING");

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/status/${orderId}`);
        if (!res.ok) return;
        const data: OrderStatusResponseBody = await res.json();
        if (cancelled) return;
        if (data.orderStatus !== statusRef.current) {
          statusRef.current = data.orderStatus;
          setStatus(data.orderStatus);
        }
      } catch {
        // transient network hiccup — the next tick retries
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  const shortId = `#${orderId.slice(0, 8).toUpperCase()}`;

  if (status === "CANCELLED") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-crimson-500 bg-crimson-50 text-crimson-600 dark:bg-coffee-800">
          <XCircle size={36} />
        </div>
        <h1 className="mt-6 font-heading text-3xl text-coffee-900 dark:text-cream-50">
          {t("track.cancelledTitle")}
        </h1>
        <KhmerDivider className="mt-4" />
        <p className="mt-4 text-coffee-500 dark:text-cream-300">
          {`${t("track.orderLabel")} ${shortId} — `}
          {t("track.cancelledDesc")}
        </p>
        <Link
          href="/menu"
          className="mt-8 rounded-xl bg-gold-500 px-8 py-3 font-semibold text-coffee-900 transition-colors hover:bg-gold-600"
        >
          {t("success.orderSomethingElse")}
        </Link>
      </div>
    );
  }

  const isDelivery = orderType === "Delivery";
  const phase = statusToPhase(status);

  const phases: {
    icon: LucideIcon;
    title: string;
    desc: string;
    animate?: boolean;
  }[] = [
    {
      icon: ScrollText,
      title: t("track.received"),
      desc: t("track.receivedDesc"),
    },
    {
      icon: Coffee,
      title: t("track.brewing"),
      desc: t("track.brewingDesc"),
      animate: true,
    },
    {
      icon: isDelivery ? Bike : PackageCheck,
      title: isDelivery ? t("track.readyDelivery") : t("track.ready"),
      desc: t("track.readyDesc"),
    },
  ];

  const progressWidth = phase === 0 ? "0%" : phase === 1 ? "50%" : "100%";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center px-4 py-12 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-600">
        {t("track.title")}
      </span>
      <h1 className="mt-3 font-heading text-2xl text-coffee-900 dark:text-cream-50 sm:text-3xl">
        {phases[phase].title}
      </h1>
      <KhmerDivider className="mt-4" />
      <p className="mt-3 text-sm text-coffee-500 dark:text-cream-300">
        {t("track.orderLabel")} {shortId}
      </p>

      {/* Horizontal progress pipeline */}
      <div className="relative mt-10 flex w-full justify-between">
        {/* Track + fill */}
        <div className="absolute left-0 right-0 top-7 h-1 rounded-full bg-coffee-200 dark:bg-coffee-700">
          <div
            className="h-full rounded-full bg-gold-500 transition-all duration-700 ease-out"
            style={{ width: progressWidth }}
          />
        </div>

        {phases.map((node, index) => {
          const Icon = node.icon;
          const isDone = index < phase;
          const isCurrent = index === phase;
          const isActive = index <= phase;
          return (
            <div
              key={index}
              className="relative z-10 flex w-1/3 flex-col items-center px-1"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
                  isActive
                    ? "border-gold-500 bg-gold-500 text-coffee-900"
                    : "border-coffee-200 bg-cream-50 text-coffee-300 dark:border-coffee-700 dark:bg-coffee-800 dark:text-coffee-500"
                } ${isCurrent ? "animate-urgent-pulse" : ""}`}
              >
                <Icon
                  size={24}
                  className={isCurrent && node.animate ? "animate-pulse" : ""}
                />
              </div>
              <p
                className={`mt-3 text-xs font-semibold leading-tight sm:text-sm ${
                  isActive
                    ? "text-coffee-900 dark:text-cream-50"
                    : "text-coffee-400 dark:text-cream-400"
                }`}
              >
                {node.title}
              </p>
              {isDone && (
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gold-600">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current phase description */}
      <div className="mt-8 flex items-center gap-3 rounded-2xl bg-coffee-100 px-6 py-4 text-coffee-800 dark:bg-coffee-800 dark:text-cream-100">
        {(() => {
          const Icon = phases[phase].icon;
          return <Icon className="shrink-0 animate-pulse" size={22} />;
        })()}
        <span className="text-left text-sm font-medium">
          {phases[phase].desc}
        </span>
      </div>

      {/* Ancestral farewell blessing */}
      <div className="mt-8 w-full rounded-2xl border border-gold-500/40 bg-gradient-to-b from-crimson-600 to-crimson-700 px-6 py-7 text-cream-50">
        <SayingBlock saying={CULTURAL.blessing} variant="light" size="md" />
      </div>

      <Link
        href="/menu"
        className="mt-8 rounded-xl bg-gold-500 px-8 py-3 font-semibold text-coffee-900 transition-colors hover:bg-gold-600"
      >
        {t("success.orderSomethingElse")}
      </Link>
    </div>
  );
}
