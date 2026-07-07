"use client";

import Link from "next/link";
import { Coffee, PartyPopper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import KhmerDivider from "@/components/KhmerDivider";
import SayingBlock from "@/components/SayingBlock";
import { CULTURAL } from "@/lib/i18n";

export default function OrderSuccess({ orderId }: { orderId: string }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold-500 bg-gold-50 text-gold-600 dark:bg-coffee-800">
        <PartyPopper size={36} />
      </div>
      <h1 className="mt-6 font-heading text-3xl text-coffee-900 dark:text-cream-50">
        {t("success.title")}
      </h1>
      <KhmerDivider className="mt-4" />
      <p className="mt-4 text-coffee-500 dark:text-cream-300">
        {`${t("payment.orderLabel")} #${orderId.slice(0, 8).toUpperCase()} `}
        {t("success.message")}
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-coffee-100 px-6 py-4 text-coffee-800 dark:bg-coffee-800 dark:text-cream-100">
        <Coffee className="animate-pulse" size={22} />
        <span className="font-semibold">{t("success.preparing")}</span>
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
