"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing, Gift, Radio, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Confetti from "@/components/Confetti";
import BongBear, { type BongBearPose } from "@/components/mascots/BongBear";
import RatingPicker from "@/components/RatingPicker";
import OrderTimeline from "@/components/OrderTimeline";
import DeliveryTrackingMap from "@/components/DeliveryTrackingMap";
import { prizeById } from "@/lib/wheel";
import type { Fortune } from "@/lib/fortunes";
import type {
  OrderStatus,
  OrderStatusResponseBody,
  OrderTimelineStamps,
  OrderType,
} from "@/lib/types";

const POLL_INTERVAL_MS = 4000;
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

/** 0 = waiting (sleeping), 1 = brewing, 2 = ready (leaping). */
function statusToPhase(status: OrderStatus): 0 | 1 | 2 {
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

const POSE_BY_PHASE: BongBearPose[] = ["sleep", "brew", "cheer"];

export default function OrderSuccess({
  orderId,
  orderType,
  fortune,
  isGift,
  spinPrize,
}: {
  orderId: string;
  orderType: OrderType;
  fortune?: Fortune | null;
  isGift?: boolean;
  spinPrize?: string | null;
}) {
  const { lang, t } = useLanguage();
  const wonPrize = prizeById(spinPrize);
  const [status, setStatus] = useState<OrderStatus>("PREPARING");
  const statusRef = useRef<OrderStatus>("PREPARING");
  const [customerRating, setCustomerRating] = useState<number | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [timeline, setTimeline] = useState<OrderTimelineStamps | null>(null);

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
        setCustomerRating(data.customerRating);
        setTelegramLinked(data.telegramLinked);
        setTimeline(data.timeline);
      } catch {
        // transient network hiccup — next tick retries
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
        <BongBear pose="sad" size={130} />
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-coffee-400 dark:text-cream-400">
          {t("track.orderLabel")} {shortId}
        </p>
        <p className="mt-4 font-heading text-base font-bold leading-relaxed text-coffee-800 dark:text-cream-100">
          អូយយយ សុំទោសម៉ាយដំឡូងខ្លាំងៗ! 🥺 ការកុម្ម៉ង់នេះមានបញ្ហាបន្តិចបន្តួចទើបត្រូវបានបោះបង់
          (ប្រហែលមកពីបាញ់លុយខុសចំនួន ឬដាច់ស្តុក)។ កុំអាក់អន់ចិត្តអីណា៎
          មកចុចកុម្ម៉ង់សារថ្មីម្ដងទៀតមក Bestie ពួកយើងចាំធ្វើជូនយ៉ាងពិសេស! 💖
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-8 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {t("success.orderSomethingElse")}
        </Link>
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <Confetti />
        <div className="animate-bounce-cute">
          <BongBear pose="cheer" size={140} />
        </div>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-matcha-600">
          {t("track.orderLabel")} {shortId}
        </p>
        <p className="mt-4 font-heading text-lg font-extrabold leading-relaxed text-coffee-900 dark:text-cream-50">
          កាហ្វេឆ្ងាញ់ដល់ដៃ Bestie រួចរាល់ហើយ! ញ៉ាំឱ្យឆ្ងាញ់ និងមានក្ដីសុខពេញមួយថ្ងៃណា៎ប្រូ/ស៊ីស
          លង់ស្តូក! ☕️ឡូវហ្នឹង! 🎉
        </p>

        {/* ⭐ Dynamic Customer Rating Calculator */}
        <RatingPicker orderId={orderId} initialRating={customerRating} />

        <Link
          href="/"
          className="mt-8 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-8 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          {t("success.orderSomethingElse")}
        </Link>
      </div>
    );
  }

  const phase = statusToPhase(status);
  const pose = POSE_BY_PHASE[phase];

  const phaseNote =
    phase === 2
      ? lang === "km"
        ? "ហោះមកយកទៅប្រូ/ស៊ីស ឆ្ងាញ់ម៉ៅដាច់! 🎉"
        : "Come grab it, bestie — it's soooo yummy! 🎉"
      : phase === 1
        ? t("track.brewingDesc")
        : t("track.receivedDesc");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center px-4 py-10 text-center">
      {/* 🎉 Screen-wide confetti fires the instant the success view mounts */}
      <Confetti />

      {/* 🎉 Celebratory headline */}
      <div className="animate-pop-in text-6xl">🎉</div>
      <h1 className="mt-3 font-heading text-2xl font-extrabold leading-snug text-coffee-900 dark:text-cream-50 sm:text-3xl">
        {t("success.headline")}
      </h1>
      <span className="mt-3 rounded-full bg-matcha-200 px-5 py-1.5 text-sm font-extrabold uppercase tracking-widest text-matcha-700 shadow-sm">
        {t("track.orderLabel")} <span className="tabular-nums">{shortId}</span>
      </span>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-coffee-600 dark:text-cream-200">
        {t("success.gratitude")}
      </p>

      {/* 🔔 Telegram Deep Linking — opt in to a DM the instant status changes */}
      {TELEGRAM_BOT_USERNAME && (
        <div className="mt-4">
          {telegramLinked ? (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-matcha-400 bg-matcha-50 px-4 py-2 text-xs font-bold text-matcha-700 dark:bg-coffee-900">
              <BellRing size={14} />
              ការជូនដំណឹង Telegram: បើកហើយ ✅
            </span>
          ) : (
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border-2 border-clay-400 bg-clay-50 px-4 py-2 text-xs font-bold text-clay-700 transition-transform hover:scale-105 active:scale-95 dark:bg-coffee-900 dark:text-clay-300"
            >
              <Bell size={14} />
              🔔 ទទួលដំណឹងតាម Telegram
            </a>
          )}
        </div>
      )}

      {/* 📡 Multi-channel tracking info — website live view + Telegram DMs */}
      <div className="mt-5 w-full rounded-2xl border-2 border-dashed border-gold-500/60 bg-gold-50/70 px-4 py-3 text-left dark:bg-coffee-800/60">
        <p className="flex items-center gap-1.5 text-xs font-extrabold text-coffee-800 dark:text-cream-100">
          <Radio size={14} className="text-gold-600" />
          តាមដានស្ថានភាព ២ ផ្លូវ · Track your order 2 ways
        </p>
        <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-coffee-600 dark:text-cream-300">
          <li>
            🖥️ <span className="font-semibold">នៅលើគេហទំព័រនេះ</span> — ទំព័រនេះ update ដោយស្វ័យប្រវត្តិ រាល់ពេលស្ថានភាពផ្លាស់ប្តូរ។
          </li>
          <li>
            🔔 <span className="font-semibold">តាម Telegram Bot</span> —{" "}
            {telegramLinked
              ? "អ្នកបានភ្ជាប់ហើយ! យើងនឹង DM ប្រាប់អ្នកភ្លាមៗ (ឧ. «ឆុងរួចរាល់», «បានបញ្ចប់») 💬"
              : "ចុចប៊ូតុង 🔔 ខាងលើ ដើម្បីទទួល DM រាល់ការ update (ឧ. «ឆុងរួចរាល់», «បានបញ្ចប់»)។"}
          </li>
        </ul>
      </div>

      {/* 🚚 Order Timeline — Grab/Foodpanda-style 4-stage stepper w/ timestamps */}
      <div className="mt-8 w-full rounded-3xl border-2 border-clay-400 bg-gradient-to-b from-cream-100 to-clay-50 px-5 py-5 dark:from-coffee-800 dark:to-coffee-900">
        <div className="mb-4 flex items-center gap-2">
          <div className={phase === 2 ? "animate-leap" : "animate-float-cute"}>
            <BongBear pose={pose} size={52} />
          </div>
          <p className="font-heading text-lg font-extrabold leading-snug text-coffee-900 dark:text-cream-50">
            ស្ថានភាពការកម្ម៉ង់ · Order Timeline
          </p>
        </div>
        {timeline && (
          <OrderTimeline status={status} orderType={orderType} timeline={timeline} />
        )}

        {/* 🛵 Live delivery route + distance/ETA (Delivery orders only) */}
        {timeline && (
          <DeliveryTrackingMap
            orderId={orderId}
            orderType={orderType}
            status={status}
            timeline={timeline}
          />
        )}
      </div>

      <p className="mt-5 flex items-center gap-2 rounded-2xl bg-matcha-100 px-5 py-3 text-sm font-medium text-coffee-800 dark:bg-coffee-800 dark:text-cream-100">
        {phase === 2 && <Sparkles size={18} className="text-gold-600" />}
        {phaseNote}
      </p>

      {/* 🐻 Loyalty stamp earned once the kitchen has accepted the order */}
      {phase >= 1 && (
        <p className="mt-3 text-xs font-semibold text-clay-600 dark:text-clay-400">
          {t("loyalty.earnedNote")}
        </p>
      )}

      {/* 💖 Gift voucher CTA */}
      {isGift && (
        <Link
          href={`/gift/${orderId}`}
          className="animate-pop-in mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-crimson-400 bg-crimson-50 py-3 font-bold text-crimson-600 transition-transform hover:scale-[1.02] active:scale-95 dark:bg-coffee-800 dark:text-crimson-400"
        >
          <Gift size={17} />
          {t("gift.viewVoucher")}
        </Link>
      )}

      {/* 🎡 Wheel of Coffee prize won */}
      {wonPrize && (
        <div className="animate-pop-in mt-6 w-full rounded-3xl border-2 border-gold-500 bg-gradient-to-r from-gold-100 to-clay-50 px-6 py-5 text-center dark:from-coffee-800 dark:to-coffee-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400">
            {t("wheel.prizeLabel")}
          </p>
          <p className="mt-1 text-4xl">{wonPrize.emoji}</p>
          <p className="mt-1 font-heading text-base font-extrabold text-coffee-900 dark:text-cream-50">
            {lang === "km" ? wonPrize.km : wonPrize.en}
          </p>
          <p className="mt-1 text-xs text-coffee-500 dark:text-cream-300">
            {t("wheel.prizeSaved")}
          </p>
        </div>
      )}

      {/* 🔮 Daily Vibe Check reveal */}
      {fortune && (
        <div className="animate-pop-in mt-6 w-full rounded-3xl border-2 border-dashed border-clay-400 bg-gradient-to-b from-clay-50 to-cream-100 px-6 py-6 dark:from-coffee-800 dark:to-coffee-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-clay-600 dark:text-clay-400">
            {lang === "km" ? "ជតារាសីថ្ងៃនេះ" : "Today's Vibe Check"} 🔮
          </p>
          <p className="mt-2 text-4xl">{fortune.emoji}</p>
          <p className="mt-2 font-heading text-base leading-relaxed text-coffee-900 dark:text-cream-50">
            {lang === "km" ? fortune.km : fortune.en}
          </p>
        </div>
      )}

      {/* 💖 Golden Words of Closure — giant pink heart container */}
      <div className="relative mt-8 w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-clay-400 via-crimson-400 to-clay-500 px-6 py-9 text-white shadow-xl">
        <span className="pointer-events-none absolute -right-4 -top-4 text-7xl opacity-20">
          💖
        </span>
        <span className="pointer-events-none absolute -bottom-5 -left-3 text-6xl opacity-20">
          🧸
        </span>
        <div className="animate-bounce-cute text-5xl">💖</div>
        <p className="mx-auto mt-4 max-w-md font-heading text-base font-bold leading-relaxed drop-shadow-sm">
          {t("success.closure")}
        </p>
      </div>

      <Link
        href="/"
        className="mt-8 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-8 py-3 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
      >
        {t("success.orderSomethingElse")}
      </Link>
    </div>
  );
}
