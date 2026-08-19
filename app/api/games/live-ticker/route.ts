import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LiveTickerResponseDTO } from "@/lib/types";

/**
 * GET /api/games/live-ticker — public, no auth. Real recent wins from
 * GameSession (Tic-Tac-Toe/RPS) for the homepage's live activity ticker,
 * plus a real completed-match count per game since midnight for each Game
 * Arena card's "played today" badge. Never fabricated — an empty ticker
 * (nobody's played yet today) renders nothing rather than a fake entry.
 */
export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [recentWins, todayCounts, todayQuizCount, openGameRooms, openQuizRooms] = await Promise.all([
      prisma.gameSession.findMany({
        where: { status: "COMPLETED", winnerId: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          gameType: true,
          winnerId: true,
          updatedAt: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
        },
      }),
      prisma.gameSession.groupBy({
        by: ["gameType"],
        where: { status: "COMPLETED", updatedAt: { gte: startOfDay } },
        _count: { _all: true },
      }),
      // Trivia Quiz Show uses a separate QuizMatch model (2-4 players, not
      // GameSession's fixed pair) — counted separately, same "real data
      // only" rule as everything else on this card grid.
      prisma.quizMatch.count({
        where: { status: { in: ["ACTIVE", "COMPLETED"] }, updatedAt: { gte: startOfDay } },
      }),
      // 🟢 Rooms joinable right now — an open, untargeted PENDING challenge
      // anyone can Quick Match into.
      prisma.gameSession.groupBy({
        by: ["gameType"],
        where: { status: "PENDING", player2Id: null, targetUserId: null },
        _count: { _all: true },
      }),
      prisma.quizMatch.count({ where: { status: "WAITING" } }),
    ]);

    const todayPlayedCounts: Record<string, number> = Object.fromEntries(
      todayCounts.map((row) => [row.gameType, row._count._all])
    );
    if (todayQuizCount > 0) {
      todayPlayedCounts.QUIZ = todayQuizCount;
    }

    const openRoomCounts: Record<string, number> = Object.fromEntries(
      openGameRooms.map((row) => [row.gameType, row._count._all])
    );
    if (openQuizRooms > 0) {
      openRoomCounts.QUIZ = openQuizRooms;
    }

    const body: LiveTickerResponseDTO = {
      entries: recentWins.map((g) => ({
        id: g.id,
        winnerName: (g.winnerId === g.player1.id ? g.player1.name : g.player2?.name) ?? "Player",
        gameType: g.gameType === "RPS" ? "RPS" : "TICTACTOE",
        at: g.updatedAt.toISOString(),
      })),
      todayPlayedCounts,
      openRoomCounts,
    };
    return NextResponse.json(body);
  } catch {
    const body: LiveTickerResponseDTO = { entries: [], todayPlayedCounts: {}, openRoomCounts: {} };
    return NextResponse.json(body);
  }
}
