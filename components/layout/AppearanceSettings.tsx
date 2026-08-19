"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Settings, Sun, Volume2, VolumeX } from "lucide-react";
import {
  useTheme,
  type ColorMode,
  type FontSize,
} from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";
import { isSoundMuted, setSoundMuted, subscribeSoundMuted } from "@/lib/soundEngine";

const THEME_OPTIONS: {
  value: ColorMode;
  labelKey: "appearance.light" | "appearance.dark" | "appearance.system";
  icon: typeof Sun;
}[] = [
  { value: "light", labelKey: "appearance.light", icon: Sun },
  { value: "dark", labelKey: "appearance.dark", icon: Moon },
  { value: "system", labelKey: "appearance.system", icon: Monitor },
];

const FONT_SIZES: {
  value: FontSize;
  labelKey: "appearance.small" | "appearance.medium" | "appearance.large";
  sampleClass: string;
}[] = [
  { value: "sm", labelKey: "appearance.small", sampleClass: "text-sm" },
  { value: "md", labelKey: "appearance.medium", sampleClass: "text-lg" },
  { value: "lg", labelKey: "appearance.large", sampleClass: "text-2xl" },
];

// 🎨 "Espresso" is today's actual default accent (clay-400, #ffb7b2) — kept
// as-is so picking it back is a genuine "reset to default," not a jarring
// unrelated color. The other four are the requested preset hues.
const ACCENT_PRESETS: { key: string; emoji: string; hex: string }[] = [
  { key: "espresso", emoji: "☕", hex: "#ffb7b2" },
  { key: "matcha", emoji: "🌸", hex: "#EC4899" },
  { key: "sage", emoji: "🌿", hex: "#10B981" },
  { key: "royal", emoji: "💙", hex: "#3B82F6" },
  { key: "violet", emoji: "💜", hex: "#8B5CF6" },
];

export default function AppearanceSettings() {
  const { t, lang, setLang } = useLanguage();
  const { colorMode, setColorMode, fontSize, setFontSize, accentColor, setAccentColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // 🔊 Global arcade-sound mute. useSyncExternalStore is the right primitive
  // here: the engine IS an external store, and the explicit server snapshot
  // (always "unmuted") keeps SSR markup and the first client paint in
  // agreement before localStorage is read.
  const muted = useSyncExternalStore(
    subscribeSoundMuted,
    isSoundMuted,
    () => false
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("appearance.openAria")}
        aria-expanded={isOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full text-coffee-800 transition-colors hover:bg-coffee-100 dark:text-cream-100 dark:hover:bg-coffee-800"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-gold-500/50 bg-cream-50 p-4 shadow-xl dark:bg-coffee-800">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-coffee-500 dark:text-cream-300">
            {t("appearance.title")}
          </p>

          <p className="mb-1.5 text-xs font-medium text-coffee-600 dark:text-cream-200">
            {t("appearance.language")}
          </p>
          <div className="mb-4 flex gap-2">
            {LANGUAGES.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLang(option.code)}
                aria-pressed={lang === option.code}
                className={`flex flex-1 items-center justify-center rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                  lang === option.code
                    ? "border-gold-500 bg-coffee-800 text-gold-400"
                    : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-medium text-coffee-600 dark:text-cream-200">
            {t("appearance.theme")}
          </p>
          <div className="mb-4 flex gap-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColorMode(option.value)}
                aria-pressed={colorMode === option.value}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                  colorMode === option.value
                    ? "border-gold-500 bg-coffee-800 text-gold-400"
                    : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                }`}
              >
                <option.icon size={16} />
                {t(option.labelKey)}
              </button>
            ))}
          </div>

          <p className="mb-1.5 text-xs font-medium text-coffee-600 dark:text-cream-200">
            {t("appearance.textSize")}
          </p>
          <div className="flex gap-2">
            {FONT_SIZES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFontSize(option.value)}
                aria-pressed={fontSize === option.value}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                  fontSize === option.value
                    ? "border-gold-500 bg-coffee-800 text-gold-400"
                    : "border-coffee-300 text-coffee-600 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-200 dark:hover:bg-coffee-700"
                }`}
              >
                <span className={`leading-none ${option.sampleClass}`}>A</span>
                {t(option.labelKey)}
              </button>
            ))}
          </div>

          <p className="mb-1.5 mt-4 text-xs font-medium text-coffee-600 dark:text-cream-200">
            {t("appearance.sound")}
          </p>
          <button
            type="button"
            onClick={() => setSoundMuted(!muted)}
            aria-pressed={!muted}
            className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
              muted
                ? "border-coffee-300 text-coffee-500 hover:bg-coffee-100 dark:border-coffee-600 dark:text-cream-300 dark:hover:bg-coffee-700"
                : "border-gold-500 bg-coffee-800 text-gold-400"
            }`}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            {muted ? t("appearance.soundOff") : t("appearance.soundOn")}
          </button>

          <p className="mb-1.5 text-xs font-medium text-coffee-600 dark:text-cream-200">
            {t("appearance.colorTheme")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setAccentColor(preset.hex)}
                aria-label={preset.key}
                aria-pressed={accentColor.toLowerCase() === preset.hex.toLowerCase()}
                title={preset.key}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-base shadow-sm transition-transform hover:scale-110 active:scale-95 ${
                  accentColor.toLowerCase() === preset.hex.toLowerCase()
                    ? "ring-2 ring-gold-500 ring-offset-2 ring-offset-cream-50 dark:ring-offset-coffee-800"
                    : ""
                }`}
                style={{ backgroundColor: preset.hex }}
              >
                {preset.emoji}
              </button>
            ))}

            {/* Custom hex picker — its own swatch doubles as the trigger,
                a native <input type="color"> has no separate "open" button. */}
            <label
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-coffee-300 text-xs text-coffee-400 transition-transform hover:scale-110 active:scale-95 dark:border-coffee-600 dark:text-cream-400"
              title={t("appearance.customColor")}
            >
              +
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                aria-label={t("appearance.customColor")}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
