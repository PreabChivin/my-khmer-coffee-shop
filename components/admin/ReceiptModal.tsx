"use client";

import { Printer, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedName } from "@/lib/i18n";
import { describeCustomization } from "@/lib/customization";
import type { DrinkCustomization, PaymentStatus } from "@/lib/types";

export interface ReceiptOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  orderType: string;
  totalAmount: number;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { nameEn: string; nameKh: string };
    customizations?: DrinkCustomization | null;
  }[];
  payment: { paymentStatus: PaymentStatus } | null;
}

export default function ReceiptModal({
  order,
  onClose,
}: {
  order: ReceiptOrder;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  const isPaid = order.payment?.paymentStatus === "PAID";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-coffee-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl bg-white shadow-2xl">
        {/* Thermal receipt — 80mm print area */}
        <div className="receipt-print-area px-5 py-6 font-mono text-[11px] leading-relaxed text-black">
          <div className="text-center">
            <p className="font-heading text-base">{t("receipt.header")}</p>
            <p>{t("receipt.subheader")}</p>
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>{t("receipt.order")}</span>
              <span>#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("receipt.date")}</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("receipt.customer")}</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("receipt.phone")}</span>
              <span>{order.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("receipt.type")}</span>
              <span>
                {order.orderType === "Delivery"
                  ? t("checkout.delivery")
                  : t("checkout.pickup")}
              </span>
            </div>
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="space-y-1.5">
            {order.items.map((item) => {
              const mods = describeCustomization(
                item.customizations ?? null,
                lang
              );
              return (
                <div key={item.id}>
                  <div className="flex justify-between gap-2">
                    <span className="flex-1">
                      {item.quantity}× {localizedName(item.product, lang)}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {mods.length > 0 && (
                    <p className="pl-3 text-[10px]">{mods.join(" · ")}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <div className="flex justify-between text-sm font-bold">
            <span>{t("receipt.total")}</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-1 text-right text-[10px] font-bold">
            {isPaid ? t("receipt.paid") : t("receipt.unpaid")}
          </div>

          <div className="my-2 border-t border-dashed border-black" />

          <p className="text-center">{t("receipt.thankYou")}</p>
          <p className="mt-1 text-center text-[10px]">
            សូមទទួលបាននូវពុទ្ធពរទាំងបួនប្រការ
          </p>
        </div>

        {/* Actions (hidden when printing) */}
        <div className="no-print flex gap-2 border-t border-coffee-200 px-5 py-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-500 py-2.5 text-sm font-semibold text-coffee-900 transition-colors hover:bg-gold-600"
          >
            <Printer size={16} />
            {t("receipt.print")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-1 rounded-xl border border-coffee-300 px-4 py-2.5 text-sm font-semibold text-coffee-600 transition-colors hover:bg-coffee-100"
          >
            <X size={16} />
            {t("receipt.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
