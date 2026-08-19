import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { quizMatchInclude, toQuizMatchDetailDTO } from "@/lib/quizDto";
import { pickRandomQuestionIds } from "@/lib/quizQuestions";
import { QUESTIONS_PER_MATCH } from "@/lib/quizEngine";

const DEFAULT_CAPACITY = 4;

/**
 * POST /api/quiz/quick-match — the Game Arena's direct entry point for
 * Trivia Quiz Show, same shape as /api/games/quick-match for the 1v1
 * games:
 *   1. Resume any WAITING/ACTIVE room the caller is already in.
 *   2. Else join the oldest open WAITING room that isn't full yet — the
 *      instant that join fills it to capacity, auto-start.
 *   3. Else open a fresh room (capacity 4) and wait.
 *
 * Known, accepted race: two players joining the same near-full room at the
 * exact same instant could both land inside the capacity check before
 * either commits (Postgres default isolation, no row lock) — worst case a
 * room ends up with one extra player. Low-severity (still fully playable,
 * nothing exploitable) and not worth a raw SELECT-FOR-UPDATE query for a
 * casual party game with this traffic level.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  try {
    const mine = await prisma.quizMatch.findFirst({
      where: {
        status: { in: ["WAITING", "ACTIVE"] },
        players: { some: { userId: session.id } },
      },
      orderBy: { createdAt: "desc" },
      include: quizMatchInclude,
    });
    if (mine) {
      return NextResponse.json(toQuizMatchDetailDTO(mine, session.id));
    }

    const openRoom = await prisma.quizMatch.findFirst({
      where: { status: "WAITING" },
      orderBy: { createdAt: "asc" },
      include: quizMatchInclude,
    });

    if (openRoom && openRoom.players.length < openRoom.capacity) {
      const joined = await prisma.$transaction(async (tx) => {
        await tx.quizPlayer.create({ data: { matchId: openRoom.id, userId: session.id } });
        const willBeFull = openRoom.players.length + 1 >= openRoom.capacity;
        if (willBeFull) {
          await tx.quizMatch.update({
            where: { id: openRoom.id },
            data: { status: "ACTIVE", currentQuestionIndex: 0, currentQuestionStartedAt: new Date() },
          });
        }
        return tx.quizMatch.findUniqueOrThrow({ where: { id: openRoom.id }, include: quizMatchInclude });
      });
      return NextResponse.json(toQuizMatchDetailDTO(joined, session.id));
    }

    const created = await prisma.$transaction(async (tx) => {
      const match = await tx.quizMatch.create({
        data: {
          capacity: DEFAULT_CAPACITY,
          questionIds: pickRandomQuestionIds(QUESTIONS_PER_MATCH),
        },
      });
      await tx.quizPlayer.create({ data: { matchId: match.id, userId: session.id } });
      return tx.quizMatch.findUniqueOrThrow({ where: { id: match.id }, include: quizMatchInclude });
    });
    return NextResponse.json(toQuizMatchDetailDTO(created, session.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចចូលរួមក្នុងបន្ទប់សំណួរបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
