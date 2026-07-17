"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import BongBear from "@/components/mascots/BongBear";
import type { GiftVoucherDTO } from "@/lib/types";

export default function GiftVoucherCard({
  voucher,
  qrDataUrl,
  shareUrl,
  showShareActions = false,
}: {
  voucher: GiftVoucherDTO;
  qrDataUrl: string;
  shareUrl: string;
  showShareActions?: boolean;
}) {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("gift.voucherTitle"),
          text: `${voucher.fromName} → ${voucher.toName} 💖`,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or share unsupported — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="animate-pop-in relative mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-clay-300 via-crimson-400 to-clay-500 p-1 shadow-2xl">
      <span className="pointer-events-none absolute -right-6 -top-6 text-8xl opacity-25">
        💖
      </span>
      <span className="pointer-events-none absolute -bottom-6 -left-6 text-7xl opacity-20">
        ✨
      </span>

      <div className="relative rounded-[1.75rem] bg-white/95 px-6 py-7 text-center dark:bg-coffee-900/95">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-crimson-500">
          {t("gift.voucherTitle")}
        </p>

        <div className="mx-auto mt-2 animate-float-cute">
          <BongBear pose="cheer" size={90} />
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-sm text-coffee-500 dark:text-cream-300">
            {t("gift.to")}: <span className="font-bold text-coffee-900 dark:text-cream-50">{voucher.toName}</span>
          </p>
          <p className="text-sm text-coffee-500 dark:text-cream-300">
            {t("gift.from")}: <span className="font-bold text-coffee-900 dark:text-cream-50">{voucher.fromName}</span>
          </p>
        </div>

        {voucher.message && (
          <p className="mt-3 rounded-2xl bg-clay-50 px-4 py-3 font-heading text-sm leading-relaxed text-coffee-800 dark:bg-coffee-800 dark:text-cream-100">
            “{voucher.message}”
          </p>
        )}

        <ul className="mt-4 space-y-0.5 text-xs text-coffee-600 dark:text-cream-300">
          {voucher.items.map((item, i) => (
            <li key={i}>
              {item.quantity}× {lang === "km" ? item.nameKh : item.nameEn}
            </li>
          ))}
        </ul>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Voucher QR code"
          className="mx-auto mt-4 h-40 w-40 rounded-xl border-2 border-clay-300 bg-white p-2"
        />
        <p className="mt-1 font-mono text-xs text-coffee-400 dark:text-cream-400">
          {voucher.shortCode}
        </p>

        <p className="mt-3 text-xs font-medium text-coffee-500 dark:text-cream-300">
          {t("gift.claimHint")}
        </p>

        <div className="mt-3">
          {voucher.redeemed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-matcha-200 px-3 py-1 text-xs font-bold text-matcha-700">
              <CheckCircle2 size={13} />
              {t("gift.redeemed")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-700 dark:bg-coffee-800 dark:text-gold-400">
              {t("gift.notRedeemed")}
            </span>
          )}
        </div>

        {showShareActions && (
          <button
            type="button"
            onClick={handleShare}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95"
          >
            {copied ? (
              <>
                <Copy size={15} /> {t("gift.linkCopied")}
              </>
            ) : (
              <>
                <Share2 size={15} /> {t("gift.shareButton")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
