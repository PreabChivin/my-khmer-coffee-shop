"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DrinkFinderBar from "@/components/home/DrinkFinderBar";
import BongBear from "@/components/mascots/BongBear";
import { useLanguage } from "@/contexts/LanguageContext";

// Pure-CSS Gen-Z slides — candy pastel gradients + floating emoji, no photos.
// Medium-saturated gradients so the white headline stays readable throughout.
const SLIDES = [
  {
    gradient: "from-clay-400 via-crimson-400 to-clay-500",
    floats: ["🧋", "🍓", "💖", "✨"],
    km: "ភេសជ្ជៈ Cute ៗ ទាំងអស់! 🧋",
    en: "The cutest sips in town! 🧋",
  },
  {
    gradient: "from-matcha-400 via-matcha-500 to-matcha-600",
    floats: ["🍵", "🌿", "🧸", "✨"],
    km: "ម៉ោង Matcha ហើយណា៎! 💚",
    en: "It's Matcha o'clock! 💚",
  },
  {
    gradient: "from-gold-400 via-clay-400 to-crimson-400",
    floats: ["☕", "⭐", "💛", "🧋"],
    km: "ឆុងដោយក្តីស្រឡាញ់ 💖",
    en: "Brewed with love 💖",
  },
  {
    gradient: "from-lavender-400 via-lavender-500 to-crimson-400",
    floats: ["🧁", "💜", "✨", "🧸"],
    km: "នំ Cute ៗ រង់ចាំប្រូ/ស៊ីស! 🧁",
    en: "Cute treats waiting for you! 🧁",
  },
];

const FLOAT_POS = [
  "left-[8%] top-[18%]",
  "right-[10%] top-[24%]",
  "left-[14%] bottom-[26%]",
  "right-[12%] bottom-[30%]",
];

const AUTO_INTERVAL_MS = 5000;

export default function HeroSlideshow({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [index, setIndex] = useState(0);

  const goTo = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [index]);

  const active = SLIDES[index];

  return (
    <section className="relative isolate flex min-h-[540px] items-center overflow-hidden text-white md:min-h-[640px]">
      {/* Cross-fading candy gradient slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* soft glow blobs for depth */}
          <div className="pointer-events-none absolute -left-16 top-10 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          {/* floating emoji decorations */}
          {slide.floats.map((emoji, fi) => (
            <span
              key={fi}
              className={`animate-float-cute pointer-events-none absolute text-4xl opacity-90 drop-shadow sm:text-5xl ${FLOAT_POS[fi]}`}
              style={{ animationDelay: `${fi * 0.6}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>
      ))}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6">
        <span className="rounded-full border border-white/50 bg-white/20 px-4 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
          {t("home.badge")}
        </span>

        {/* rotating cute caption */}
        <p
          key={index}
          className="animate-pop-in text-lg font-extrabold drop-shadow sm:text-xl"
        >
          {lang === "km" ? active.km : active.en}
        </p>

        <h1 className="max-w-2xl font-heading text-4xl font-extrabold leading-tight drop-shadow-md sm:text-5xl md:text-6xl">
          {t("home.title")}
        </h1>

        <p className="max-w-xl text-base font-medium text-white/90 drop-shadow-sm sm:text-lg">
          {t("home.subtitle")}
        </p>

        <DrinkFinderBar searchQuery={searchQuery} onSearchChange={onSearchChange} />
      </div>

      {/* 🐻 Bong Bear greets guests from the corner */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden animate-float-cute drop-shadow-lg sm:block">
        <BongBear pose="wave" size={120} />
      </div>

      {/* Slide navigation */}
      <button
        type="button"
        onClick={() => goTo(index - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 sm:left-6"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 sm:right-6"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
