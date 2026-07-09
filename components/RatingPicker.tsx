"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { playPop, playTick } from "@/lib/sfx";

/** ⭐ Post-order 5-star rating picker — shown once an order is COMPLETED. */
export default function RatingPicker({
  orderId,
  initialRating,
}: {
  orderId: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(initialRating !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePick(stars: number) {
    if (submitted || isSubmitting) return;
    playPop();
    setRating(stars);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/products/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating: stars }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-pop-in mt-6 w-full rounded-3xl border-2 border-dashed border-gold-500 bg-gold-50/60 px-6 py-6 text-center dark:bg-coffee-900/40">
      {submitted ? (
        <>
          <p className="text-3xl">🥰</p>
          <div className="mt-1 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={
                  star <= rating
                    ? "fill-gold-500 text-gold-500"
                    : "fill-transparent text-coffee-300 dark:text-coffee-600"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-sm font-bold text-coffee-800 dark:text-cream-100">
            អរគុណច្រើនសម្រាប់ការវាយតម្លៃ! 💖 (Thanks for rating, bestie!)
          </p>
        </>
      ) : (
        <>
          <p className="font-heading text-sm font-bold leading-relaxed text-coffee-900 dark:text-cream-50">
            តើភេសជ្ជៈនេះផ្ដល់ក្ដីស្រឡាញ់កម្រិតណាដែរម៉ាយដំឡូង? 🥰⭐
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePick(star)}
                  onMouseEnter={() => {
                    playTick();
                    setHoverRating(star);
                  }}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star`}
                  className="transition-transform hover:scale-125 active:scale-95 disabled:opacity-60"
                >
                  <Star
                    size={30}
                    className={
                      filled
                        ? "fill-gold-500 text-gold-500 drop-shadow-[0_0_4px_rgba(255,195,46,0.7)]"
                        : "fill-transparent text-coffee-300 dark:text-coffee-600"
                    }
                  />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
