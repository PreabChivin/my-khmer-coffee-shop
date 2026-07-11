"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Bell, Camera, ImageOff, Loader2, X } from "lucide-react";
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
  process.env.NEXT_PUBLIC_KHQR_ACCOUNT_NAME ?? "PREAB CHIVIN";
const MAX_PHOTO_BYTES = 4.5 * 1024 * 1024;
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const onApprovedRef = useRef(onApproved);

  useEffect(() => {
    onApprovedRef.current = onApproved;
  });

  useEffect(() => {
    // Revoke the object URL on unmount so the blob isn't retained forever.
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function handleProofSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setProofError(null);
    if (!file.type.startsWith("image/")) {
      setProofError("សូមជ្រើសរើសរូបភាពមួយណា៎ (JPG, PNG)។");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setProofError("រូបភាពធំពេក (កំណត់ 4.5MB)។");
      return;
    }

    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    setProofFile(file);
    setProofPreviewUrl(URL.createObjectURL(file));
  }

  function removeProof() {
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    setProofFile(null);
    setProofPreviewUrl(null);
  }

  async function handleConfirmPaid() {
    setIsConfirming(true);
    try {
      const formData = new FormData();
      if (proofFile) formData.append("photo", proofFile);
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
        body: formData,
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
            <>
              {/* 📸 Optional payment-proof screenshot — forwarded straight to
                  the staff group via Telegram, never stored on our servers. */}
              <div className="mt-4">
                {proofPreviewUrl ? (
                  <div className="flex items-center gap-2 rounded-xl border border-coffee-300 bg-cream-50 p-2 dark:border-coffee-600 dark:bg-coffee-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPreviewUrl}
                      alt="Payment proof preview"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="flex-1 truncate text-xs text-coffee-600 dark:text-cream-300">
                      {proofFile?.name}
                    </span>
                    <button
                      type="button"
                      onClick={removeProof}
                      aria-label="Remove"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-coffee-400 hover:bg-coffee-100 dark:hover:bg-coffee-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-coffee-300 py-2.5 text-xs font-semibold text-coffee-500 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-800">
                    <Camera size={14} />
                    📸 ភ្ជាប់រូបថតបញ្ជាក់ការទូទាត់ (មិនចាំបាច់)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofSelected}
                      className="hidden"
                    />
                  </label>
                )}
                {proofError && (
                  <p className="mt-1.5 text-center text-xs font-medium text-crimson-500">
                    {proofError}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmPaid}
                disabled={isConfirming}
                className="mt-3 w-full rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                បាញ់លុយរួចហើយម៉ាយដំឡូង ចុចលិប! 👆
              </button>
            </>
          )}

          {/* 🔔 Optional Telegram updates — always visible on the payment
              screen (the order already exists here, so the deep link works
              right away). Opt-in, no phone number: a plain link click opens
              the bot so the webhook captures their chat_id and every future
              status change DMs them. */}
          {TELEGRAM_BOT_USERNAME && (
            <a
              href={`https://t.me/${TELEGRAM_BOT_USERNAME}?start=${orderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-clay-400 bg-clay-50 py-2.5 text-sm font-bold text-clay-700 transition-transform hover:scale-[1.02] active:scale-95 dark:bg-coffee-900 dark:text-clay-300"
            >
              <Bell size={16} />
              🔔 ទទួលដំណឹងតាម Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
