"use client";

import { Clock, Coffee, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import KhmerDivider from "@/components/layout/KhmerDivider";

export default function Footer() {
  const { t } = useLanguage();

  const hours = [
    { day: "home.hoursWeekday", key: "weekday" },
    { day: "home.hoursWeekend", key: "weekend" },
  ] as const;

  return (
    <footer className="mt-auto border-t-2 border-gold-500/70 bg-coffee-900 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <KhmerDivider className="text-gold-500" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
              <Coffee size={18} />
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-lg">បេនជីមីន កាហ្វេ</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-400">
                BenChimin Cafe
              </span>
            </span>
          </div>
          <p className="mt-3 text-sm text-coffee-200">{t("footer.tagline")}</p>
        </div>

        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gold-400">
            <Clock size={16} /> {t("footer.storeHours")}
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-coffee-200">
            {hours.map((entry) => (
              <li key={entry.key}>{t(entry.day)}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-gold-400">{t("footer.visitUs")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-coffee-200">
            <li className="flex items-center gap-2">
              <MapPin size={16} /> {t("footer.addressLine")}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> 012 345 678
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-coffee-700 py-4 text-center text-xs text-coffee-300">
        © {new Date().getFullYear()} បេនជីមីន កាហ្វេ — BenChimin Cafe.{" "}
        {t("footer.rights")}
      </div>
    </footer>
  );
}
