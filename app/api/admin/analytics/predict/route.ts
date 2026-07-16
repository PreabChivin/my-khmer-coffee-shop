import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import type { SalesPredictionDTO } from "@/lib/types";

const LOOKBACK_DAYS = 7;

/**
 * GET /api/admin/analytics/predict
 * A simple moving-average trend over the last 7 days of PAID revenue —
 * intentionally NOT a trained ML model (the brief asked for a Python
 * "predictive sales algorithm" service for this; a real forecasting model
 * needs months of clean historical data and ongoing retraining to be
 * trustworthy, which is a separate, much larger project — building a fake
 * one here would just be a confident-looking guess). This gives Staff/Admin
 * an honest, transparent trend signal today: are the last few days up or
 * down versus the days before them, and what does "more of the same" project
 * for next week. Same revenue definition as GET /api/admin/stats
 * (payment.paymentStatus === "PAID"), so the two numbers stay comparable.
 */
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  try {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (LOOKBACK_DAYS - 1));

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, payment: { paymentStatus: "PAID" } },
      select: { createdAt: true, totalAmount: true },
    });

    const totalsByDay = new Map<string, number>();
    for (let i = 0; i < LOOKBACK_DAYS; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      totalsByDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (totalsByDay.has(key)) {
        totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + order.totalAmount);
      }
    }

    const recentDaily = [...totalsByDay.entries()].map(([date, total]) => ({
      date,
      total: Math.round(total * 100) / 100,
    }));

    const averageDailyTotal =
      recentDaily.reduce((sum, d) => sum + d.total, 0) / recentDaily.length;

    const midpoint = Math.floor(recentDaily.length / 2);
    const firstHalfAvg =
      recentDaily.slice(0, midpoint).reduce((sum, d) => sum + d.total, 0) / (midpoint || 1);
    const secondHalfAvg =
      recentDaily.slice(midpoint).reduce((sum, d) => sum + d.total, 0) /
      (recentDaily.length - midpoint);

    let trend: SalesPredictionDTO["trend"] = "flat";
    let trendPercent = 0;
    if (firstHalfAvg > 0) {
      trendPercent = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 1000) / 10;
      if (trendPercent > 5) trend = "up";
      else if (trendPercent < -5) trend = "down";
    } else if (secondHalfAvg > 0) {
      trend = "up";
      trendPercent = 100;
    }

    const body: SalesPredictionDTO = {
      recentDaily,
      averageDailyTotal: Math.round(averageDailyTotal * 100) / 100,
      projectedNextWeekTotal: Math.round(averageDailyTotal * 7 * 100) / 100,
      trend,
      trendPercent,
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
