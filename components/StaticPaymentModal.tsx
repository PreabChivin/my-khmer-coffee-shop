"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ImageOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import BongBear from "@/components/mascots/BongBear";
import type { OrderStatusResponseBody } from "@/lib/types";

interface StaticPaymentModalProps {
  orderId: string;
  totalAmount: number;
  onApproved: () => void;
  onClose: () => void;
}

const POLL_INTERVAL_MS = 3000;
const ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_KHQR_ACCOUNT_NAME ?? "[បញ្ចូលឈ្មោះពិតរបស់អ្នក]";

export default function StaticPaymentModal({
  orderId,
  totalAmount,
  onApproved,
  onClose,
}: StaticPaymentModalProps) {
  const { t } = useLanguage();
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const onApprovedRef = useRef(onApproved);

  useEffect(() => {
    onApprovedRef.current = onApproved;
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/status/${orderId}`);
        if (!res.ok) return;
        const data: OrderStatusResponseBody = await res.json();
        if (data.orderStatus === "AWAITING_VERIFICATION") {
          setHasConfirmed(true);
        }
        if (data.orderStatus === "PREPARING") {
          onApprovedRef.current();
        }
      } catch {
        // network hiccup — the next poll tick will retry
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    poll();
    return () => clearInterval(interval);
  }, [orderId]);

  async function handleConfirmPaid() {
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
      });
      if (res.ok) setHasConfirmed(true);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="khmer-frame animate-neon-frame relative w-full max-w-sm rounded-3xl bg-cream-100 p-2 dark:bg-coffee-900">
        <div className="relative rounded-[1.35rem] bg-cream-50 px-6 py-7 dark:bg-coffee-800">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-coffee-400 hover:text-coffee-700 dark:text-cream-400 dark:hover:text-cream-100"
          >
            ✕
          </button>

          <div className="text-center">
            <p className="khmer-heading-glow font-heading text-2xl text-coffee-900 dark:text-cream-50">
              បេនជីមីន កាហ្វេ
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-500 dark:text-cream-300">
              BenChimin Cafe
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-clay-400 bg-clay-50 px-3 py-1 text-[11px] font-bold text-clay-600 dark:bg-coffee-900 dark:text-clay-400">
              <BadgeCheck size={13} />
              បាញ់លុយមកប្រូ/ស៊ីស 💖 Send Love via QR
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center">
            <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-xl border-2 border-gold-500 bg-white p-2 shadow-inner">
              {imageFailed ? (
                <div className="flex flex-col items-center gap-2 px-4 text-center text-coffee-400">
                  <ImageOff size={28} />
                  <p className="text-xs">
                    QR image unavailable. Please contact staff.
                  </p>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/my-khqr.png"
                  alt="Shop KHQR payment code"
                  className="h-full w-full object-contain"
                  onError={() => {
                    console.error(
                      "[KHQR] Static QR image failed to load. Drop your bank-issued KHQR image at: public/images/my-khqr.png"
                    );
                    setImageFailed(true);
                  }}
                />
              )}
            </div>

            <p className="mt-4 text-3xl font-bold text-coffee-900 dark:text-cream-50">
              ${totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-coffee-500 dark:text-cream-300">
              {t("payment.orderLabel")} #{orderId.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {/* 🐻 Bong Bear reminds you to verify the account name */}
          <div className="mt-5 flex items-end gap-2">
            <div className="shrink-0 animate-float-cute">
              <BongBear pose="wave" size={72} />
            </div>
            <div className="relative flex-1 rounded-2xl rounded-bl-none border-2 border-clay-400 bg-clay-50 px-3 py-2.5 text-left dark:bg-coffee-900">
              <p className="text-xs font-semibold leading-relaxed text-coffee-800 dark:text-cream-100">
                ផ្ទៀងឈ្មោះពិត{" "}
                <span className="text-clay-600 dark:text-clay-400">
                  {ACCOUNT_NAME}
                </span>{" "}
                មុននឹងបាញ់បច្ច័យណា៎ប្រូ/ស៊ីស! 😘
              </p>
              <p className="mt-1 text-[11px] leading-snug text-coffee-500 dark:text-cream-300">
                Double-check the name{" "}
                <span className="font-semibold">{ACCOUNT_NAME}</span> before you
                send — okayy bestie! ✨
              </p>
            </div>
          </div>

          {hasConfirmed ? (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gold-100 px-4 py-3 text-sm font-medium text-gold-700 dark:bg-coffee-900 dark:text-gold-400">
              <Loader2 size={16} className="animate-spin" />
              {t("payment.awaitingVerification")}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConfirmPaid}
              disabled={isConfirming}
              className="mt-5 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              បាញ់លុយរួចហើយម៉ាយដំឡូង ចុចលិប! 👆
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
