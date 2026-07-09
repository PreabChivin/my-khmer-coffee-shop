"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import BongBear from "@/components/mascots/BongBear";
import ApsaraChibi from "@/components/mascots/ApsaraChibi";

const SLIDES = [
  {
    gradient: "from-clay-300 to-crimson-300",
    emoji: "🎡",
    km: "ចាយ $3+ ដោះសោកង់នាំលាភ!",
    en: "Spend $3+ to unlock the Vibe Wheel!",
    mascot: "bear" as const,
  },
  {
    gradient: "from-matcha-300 to-matcha-500",
    emoji: "🐻",
    km: "ប្រមូល ៦ ត្រា = ភេសជ្ជៈឥតគិតថ្លៃ!",
    en: "Collect 6 stamps = a FREE drink!",
    mascot: "apsara" as const,
  },
  {
    gradient: "from-gold-300 to-clay-400",
    emoji: "🧋",
    km: "បន្ថែមបុកបាគ្រាន់តែ $0.50!",
    en: "Add boba for just $0.50!",
    mascot: "bear" as const,
  },
  {
    gradient: "from-lavender-400 to-crimson-300",
    emoji: "💖",
    km: "ទិញផ្ញើឱ្យ Bestie/Crush ជាកាដូ!",
    en: "Send a drink to your bestie or crush!",
    mascot: "apsara" as const,
  },
];

const AUTO_MS = 4000;

export default function PromoBannerCarousel() {
  const { lang } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTO_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="relative h-24 overflow-hidden rounded-3xl shadow-md sm:h-28">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={`absolute inset-0 flex items-center gap-4 bg-gradient-to-r ${slide.gradient} px-6 text-white transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="animate-float-cute shrink-0">
              {slide.mascot === "bear" ? (
                <BongBear pose="cheer" size={64} />
              ) : (
                <ApsaraChibi size={56} />
              )}
            </div>
            <p className="font-heading text-base font-extrabold leading-snug drop-shadow-sm sm:text-lg">
              {slide.emoji} {lang === "km" ? slide.km : slide.en}
            </p>
          </div>
        ))}

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to promo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
