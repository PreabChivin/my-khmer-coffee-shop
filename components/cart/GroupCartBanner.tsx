"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, LogOut, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGroupCart } from "@/contexts/GroupCartContext";
import { customizationSurcharge, describeCustomization } from "@/lib/customization";
import { localizedName } from "@/lib/i18n";

export default function GroupCartBanner() {
  const { lang, t } = useLanguage();
  const { groupId, state, contributorName, leaveGroupSession } = useGroupCart();
  const [copied, setCopied] = useState(false);

  if (!groupId) return null;

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/menu?group=${groupId}`
      : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the link is still visible to select manually
    }
  }

  const items = state?.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.product.price + customizationSurcharge(item.customization);
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <div className="animate-pop-in mb-8 rounded-3xl border-2 border-dashed border-clay-400 bg-gradient-to-br from-clay-50 to-cream-100 p-5 dark:from-coffee-800 dark:to-coffee-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-400 text-white">
            <Users size={18} />
          </span>
          <div>
            <p className="font-heading text-base text-coffee-900 dark:text-cream-50">
              {t("group.bannerTitle")}
            </p>
            {contributorName && (
              <p className="text-xs text-coffee-500 dark:text-cream-300">
                {t("group.addingAs")}: <strong>{contributorName}</strong>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={leaveGroupSession}
          className="flex items-center gap-1.5 rounded-full border border-coffee-300 px-3 py-1.5 text-xs font-semibold text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-800"
        >
          <LogOut size={13} />
          {t("group.leave")}
        </button>
      </div>

      <p className="mt-3 text-sm text-coffee-600 dark:text-cream-200">
        {t("group.bannerHint")}
      </p>

      <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 dark:bg-coffee-800/70">
        <span className="flex-1 truncate text-xs text-coffee-600 dark:text-cream-300">
          {inviteLink}
        </span>
        <button
          type="button"
          onClick={copyLink}
          className="flex shrink-0 items-center gap-1 rounded-full bg-clay-400 px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Copy size={12} />
          {copied ? t("group.linkCopied") : t("group.copyLink")}
        </button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-clay-600 dark:text-clay-400">
          {t("group.itemsTitle")} ({items.length})
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-coffee-400 dark:text-cream-400">
            {t("group.empty")}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => {
              const mods = describeCustomization(item.customization, lang);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-sm dark:bg-coffee-800/60"
                >
                  <span className="text-coffee-800 dark:text-cream-100">
                    <strong>{item.contributorName}</strong> · {item.quantity}×{" "}
                    {localizedName(
                      { nameEn: item.product.nameEn, nameKh: item.product.nameKh },
                      lang
                    )}
                    {mods.length > 0 && (
                      <span className="text-coffee-400 dark:text-cream-400">
                        {" "}
                        ({mods.join(", ")})
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-bold text-coffee-900 dark:text-cream-50">
            ${subtotal.toFixed(2)}
          </span>
          <Link
            href="/checkout"
            className="rounded-full bg-gradient-to-r from-clay-400 to-crimson-400 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            {t("group.checkout")}
          </Link>
        </div>
      )}
    </div>
  );
}
