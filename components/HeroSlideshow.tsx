"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import KhmerDivider from "@/components/KhmerDivider";
import FulfillmentBar from "@/components/FulfillmentBar";
import BongBear from "@/components/mascots/BongBear";
import { useLanguage } from "@/contexts/LanguageContext";

const SLIDES = [
  {
    image: "/images/hero-angkor-sunrise.jpg",
    alt: "Angkor Wat temple silhouette at golden sunrise",
  },
  {
    image: "/images/hero-coffee-wood.jpg",
    alt: "Latte art coffee cup on a rustic wooden table",
  },
  {
    image: "/images/hero-ta-prohm.jpg",
    alt: "Ancient tree roots overtaking the stone ruins of Ta Prohm temple",
  },
];

const AUTO_INTERVAL_MS = 5500;

export default function HeroSlideshow() {
  const { t } = useLanguage();
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

  return (
    <section className="relative isolate flex min-h-[560px] items-center overflow-hidden text-cream-50 md:min-h-[680px]">
      {SLIDES.map((slide, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.image}
          src={slide.image}
          alt={slide.alt}
          aria-hidden={i !== index}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Legibility gradient over the photography */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-800/55 to-stone-900/85" />
      <div className="stone-texture pointer-events-none absolute inset-0 opacity-10 mix-blend-overlay" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
        <span className="rounded-full border border-gold-500/70 bg-coffee-900/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-gold-400">
          {t("home.badge")}
        </span>

        <h1 className="khmer-heading-glow max-w-2xl font-heading text-4xl leading-tight sm:text-5xl md:text-6xl">
          {t("home.title")}
        </h1>

        <p className="khmer-heading-glow font-heading text-lg text-gold-400 sm:text-xl">
          {t("hero.tagline")}
        </p>

        <KhmerDivider className="text-gold-500" />

        <p className="max-w-xl text-base text-cream-100 sm:text-lg">
          {t("home.subtitle")}
        </p>

        <FulfillmentBar />
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
        className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/50 bg-coffee-900/50 text-cream-50 transition-colors hover:bg-coffee-900/80 sm:left-6"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gold-500/50 bg-coffee-900/50 text-cream-50 transition-colors hover:bg-coffee-900/80 sm:right-6"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-gold-500" : "w-2 bg-cream-50/50 hover:bg-cream-50/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
