"use client";

import { tierProgress } from "@/lib/loyaltyPoints";

/**
 * 💎 Loyalty points header + tier progress bar. Shows the current points
 * balance, current tier, and a pastel progress bar toward the next tier.
 */
export default function LoyaltyProgress({ points }: { points: number }) {
  const { current, next, percent, pointsToNext } = tierProgress(points);

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-clay-400 via-crimson-400 to-clay-500 p-5 text-white shadow-lg">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
            ពិន្ទុសន្សំ · Loyalty Points
          </p>
          <p className="font-heading text-4xl font-extrabold drop-shadow-sm">
            {points.toLocaleString()}
            <span className="ml-1 text-base font-bold">💎</span>
          </p>
        </div>
        <span className="rounded-full bg-white/25 px-3 py-1 text-sm font-extrabold backdrop-blur-sm">
          {current.emoji} {current.name}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs font-semibold text-white/90">
          {next
            ? `នៅសល់ ${pointsToNext.toLocaleString()} ពិន្ទុ ដើម្បីឡើងកម្រិត ${next.emoji} ${next.name}!`
            : `🎉 អ្នកបានឈានដល់កម្រិតខ្ពស់បំផុត ${current.emoji} ${current.name} ហើយ!`}
        </p>
      </div>
    </div>
  );
}
