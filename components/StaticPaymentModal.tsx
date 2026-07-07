"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ImageOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
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

function TempleCornerOrnament({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`pointer-events-none absolute h-8 w-8 text-gold-500 ${className}`}
    >
      <path
        d="M20 2 L26 12 L20 10 L14 12 Z"
        fill="currentColor"
      />
      <rect x="17" y="10" width="6" height="5" fill="currentColor" />
      <path
        d="M2 20 C2 10 10 2 20 2 M20 2 C30 2 38 10 38 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="20" cy="2" r="2" fill="currentColor" />
    </svg>
  );
}

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
      <div className="khmer-frame stone-texture relative w-full max-w-sm rounded-2xl p-2">
        <TempleCornerOrnament className="-left-1 -top-1" />
        <TempleCornerOrnament className="-right-1 -top-1 -scale-x-100" />
        <TempleCornerOrnament className="-bottom-1 -left-1 -scale-y-100" />
        <TempleCornerOrnament className="-bottom-1 -right-1 -scale-x-100 -scale-y-100" />

        <div className="relative rounded-xl bg-cream-50 px-6 py-7 dark:bg-coffee-800">
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
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-500 bg-gold-50 px-3 py-1 text-[11px] font-semibold text-gold-700 dark:bg-coffee-900 dark:text-gold-400">
              <BadgeCheck size={13} />
              គណនីផ្លូវការរបស់ហាង / Official Shop Account
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

          <p className="mt-5 rounded-xl border border-gold-500/40 bg-gold-50 px-4 py-3 text-center text-xs leading-relaxed text-coffee-700 dark:bg-coffee-900 dark:text-cream-200">
            សូមមេត្តាពិនិត្យផ្ទៀងផ្ទាត់ឈ្មោះគណនី{" "}
            <span className="font-semibold">{ACCOUNT_NAME}</span>{" "}
            ជាមុនសិន មុននឹងធ្វើការបញ្ជូនបច្ច័យ។
            <br />
            <span className="text-coffee-500 dark:text-cream-300">
              Note: The receiving account is registered under{" "}
              <span className="font-semibold">{ACCOUNT_NAME}</span>. Please
              kindly verify this name before completing your transfer.
            </span>
          </p>

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
              className="mt-5 w-full rounded-xl bg-clay-500 py-3 text-sm font-bold text-cream-50 shadow-md transition-colors hover:bg-clay-600 disabled:opacity-60"
            >
              ខ្ញុំបានផ្ទេរប្រាក់រួចហើយ / I Have Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
