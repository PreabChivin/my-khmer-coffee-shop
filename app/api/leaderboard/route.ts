import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LeaderboardRowDTO } from "@/lib/types";

/**
 * GET /api/leaderboard — All-Time ranking by Arcade Points
 * (`User.loyaltyPoints`). Public (no session required) — a leaderboard is
 * meant to be seen by everyone, and only shows name + points, nothing
 * private.
 *
 * Daily/Weekly windows aren't offered: this app has no time-windowed score
 * tracking (missions/game wins are lifetime or "did it happen today"
 * flags, not a dated log), so faking a Daily/Weekly sort over the same
 * all-time numbers would just relabel identical data as something it
 * isn't. The UI shows those tabs as "Coming Soon" instead.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { role: "CUSTOMER", loyaltyPoints: { gt: 0 } },
      orderBy: { loyaltyPoints: "desc" },
      take: 50,
      select: { id: true, name: true, loyaltyPoints: true },
    });

    const body: LeaderboardRowDTO[] = users.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      loyaltyPoints: u.loyaltyPoints,
    }));

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
