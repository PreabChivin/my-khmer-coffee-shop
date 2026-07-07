"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Coffee, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import AppearanceSettings from "@/components/AppearanceSettings";

export default function Header() {
  const { totalItems, openCart } = useCart();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/menu", label: t("nav.menu") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold-500/70 bg-cream-50/95 backdrop-blur dark:bg-coffee-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-coffee-900 dark:text-cream-50">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 bg-coffee-800 text-gold-400">
            <Coffee size={20} />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-lg">បេនជីមីន កាហ្វេ</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-coffee-500 dark:text-cream-300">
              BenChimin Cafe
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-coffee-600 dark:hover:text-cream-100 ${
                pathname === link.href
                  ? "text-coffee-800 dark:text-cream-50"
                  : "text-coffee-500 dark:text-cream-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <AppearanceSettings />

          <button
            type="button"
            onClick={openCart}
            aria-label={t("cart.openAria")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-colors hover:bg-coffee-100 dark:text-cream-100 dark:hover:bg-coffee-800"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[11px] font-bold text-coffee-900">
                {totalItems}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 hover:bg-coffee-100 dark:text-cream-100 dark:hover:bg-coffee-800 sm:hidden"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-coffee-200 bg-cream-50 px-4 py-3 dark:border-coffee-700 dark:bg-coffee-900 sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === link.href
                  ? "bg-coffee-100 text-coffee-900 dark:bg-coffee-800 dark:text-cream-50"
                  : "text-coffee-600 dark:text-cream-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
