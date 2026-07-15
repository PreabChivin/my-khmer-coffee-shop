import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { GameStatsDTO } from "@/lib/types";

/**
 * GET /api/chat/games/stats
 * The caller's own lifetime Café Lounge scoreboard (wins / losses / ties).
 * Fetched when the game menu opens, not on every poll tick.
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { gameWins: true, gameLosses: true, gameTies: true },
    });
    if (!user) {
      return NextResponse.json({ error: "រកមិនឃើញគណនីនេះទេ។" }, { status: 404 });
    }
    const body: GameStatsDTO = {
      wins: user.gameWins,
      losses: user.gameLosses,
      ties: user.gameTies,
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
