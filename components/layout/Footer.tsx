"use client";

import Link from "next/link";
import { Gamepad2, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import KhmerDivider from "@/components/layout/KhmerDivider";

const LINKS = [
  { href: "/", labelKm: "ទីលានហ្គេម", labelEn: "Game Arena", icon: Gamepad2 },
  { href: "/leaderboard", labelKm: "តារាងចំណាត់ថ្នាក់", labelEn: "Leaderboard", icon: Trophy },
  { href: "/avatar-studio", labelKm: "ស្ទូឌីយោអវតារ", labelEn: "Avatar Studio", icon: Sparkles },
  { href: "/social", labelKm: "Social Lounge", labelEn: "Social Lounge", icon: MessageCircle },
];

export default function Footer() {
  const { t, lang } = useLanguage();
  const km = lang === "km";

  return (
    <footer className="mt-auto border-t-2 border-gold-500/70 bg-coffee-900 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <KhmerDivider className="text-gold-500" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
              <Gamepad2 size={18} />
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-lg">បេនជីមីន អាកែត</span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-400">
                BENCHIMIN ARCADE
              </span>
            </span>
          </div>
          <p className="mt-3 text-sm text-coffee-200">
            {km
              ? "ទីលានប្រកួតប្រជែងហ្គេមកំសាន្ត និងលេងជាមួយគ្នាយ៉ាងសប្បាយរីករាយ"
              : "A social gaming arcade — play, compete, and hang out together."}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-gold-400">{km ? "ម៉ូឌុល" : "Modules"}</h3>
          <ul className="mt-3 space-y-2 text-sm text-coffee-200">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center gap-2 hover:text-gold-300">
                  <l.icon size={16} /> {km ? l.labelKm : l.labelEn}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-coffee-700 py-4 text-center text-xs text-coffee-300">
        © {new Date().getFullYear()} បេនជីមីន អាកែត — BENCHIMIN ARCADE. {t("footer.rights")}
      </div>
    </footer>
  );
}
