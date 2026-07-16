"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, LineChart } from "lucide-react";
import type { SalesPredictionDTO } from "@/lib/types";

const TREND_STYLE: Record<
  SalesPredictionDTO["trend"],
  { icon: typeof TrendingUp; color: string }
> = {
  up: { icon: TrendingUp, color: "text-matcha-600 dark:text-matcha-400" },
  down: { icon: TrendingDown, color: "text-crimson-600 dark:text-crimson-400" },
  flat: { icon: Minus, color: "text-coffee-500 dark:text-cream-300" },
};

/** 📊 A 7-day moving-average trend, NOT a trained forecasting model — see
 *  GET /api/admin/analytics/predict for the exact heuristic. Fetched once on
 *  mount; this is a directional signal for Staff/Admin, not a live ticker. */
export default function AdminPredictivePanel() {
  const [data, setData] = useState<SalesPredictionDTO | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/analytics/predict")
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  const maxTotal = Math.max(...data.recentDaily.map((d) => d.total), 1);
  const TrendIcon = TREND_STYLE[data.trend].icon;

  return (
    <div className="khmer-card mb-6 rounded-2xl bg-gradient-to-br from-lavender-50 to-cream-100 p-5 dark:from-coffee-800 dark:to-coffee-900">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 font-heading text-base text-coffee-900 dark:text-cream-50">
          <LineChart size={17} /> និន្នាការលក់ 7 ថ្ងៃ · Sales Trend
        </p>
        <span className={`flex items-center gap-1 text-sm font-bold ${TREND_STYLE[data.trend].color}`}>
          <TrendIcon size={16} />
          {data.trendPercent > 0 ? "+" : ""}
          {data.trendPercent}%
        </span>
      </div>

      <div className="mb-4 flex items-end gap-2" style={{ height: 64 }}>
        {data.recentDaily.map((day) => (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-lavender-400 dark:bg-lavender-600"
              style={{ height: `${Math.max((day.total / maxTotal) * 100, 4)}%` }}
              title={`$${day.total.toFixed(2)}`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/70 p-3 dark:bg-coffee-800/70">
          <p className="text-[11px] uppercase tracking-wide text-coffee-400 dark:text-cream-400">
            មធ្យមភាគប្រចាំថ្ងៃ · Daily Avg
          </p>
          <p className="text-lg font-bold text-coffee-900 dark:text-cream-50">
            ${data.averageDailyTotal.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 dark:bg-coffee-800/70">
          <p className="text-[11px] uppercase tracking-wide text-coffee-400 dark:text-cream-400">
            ការព្យាករណ៍សប្តាហ៍ក្រោយ · Next Week
          </p>
          <p className="text-lg font-bold text-coffee-900 dark:text-cream-50">
            ${data.projectedNextWeekTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
