import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { quizMatchInclude, toQuizMatchDetailDTO } from "@/lib/quizDto";
import { tryAdvanceQuizMatch } from "@/lib/quizAdvance";
import { computeAnswerPoints, QUESTION_DURATION_MS } from "@/lib/quizEngine";
import { getQuizQuestion } from "@/lib/quizQuestions";

type StoredAnswers = Record<string, { choice: number; ms: number }>;

/**
 * POST /api/quiz/[id]/answer — Body: { choiceIndex: 0-3 }
 * Records the caller's answer to the CURRENT question, computes points
 * server-side from the server's own clock (never a client-reported
 * elapsed time — see lib/quizEngine.ts), and — if that was the last player
 * still needed to answer — advances the room to the next question (or to
 * COMPLETED + podium rewards) via the same atomic claim every other
 * write path in this app uses.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id } = await params;

  let body: { choiceIndex?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const choiceIndex = body.choiceIndex;
  if (typeof choiceIndex !== "number" || ![0, 1, 2, 3].includes(choiceIndex)) {
    return NextResponse.json({ error: "ចម្លើយមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  try {
    const receivedAt = Date.now();
    const match = await prisma.quizMatch.findUnique({ where: { id }, include: quizMatchInclude });
    if (!match) {
      return NextResponse.json({ error: "រកមិនឃើញបន្ទប់សំណួរនេះទេ។" }, { status: 404 });
    }
    if (match.status !== "ACTIVE" || !match.currentQuestionStartedAt) {
      return NextResponse.json({ error: "សំណួរនេះមិនកំពុងសកម្មទេ។" }, { status: 409 });
    }
    const myRow = match.players.find((p) => p.userId === session.id);
    if (!myRow) {
      return NextResponse.json({ error: "អ្នកមិនមែនជាសមាជិកបន្ទប់នេះទេ។" }, { status: 403 });
    }
    const idx = match.currentQuestionIndex;
    const myAnswers = (myRow.answers as StoredAnswers | null) ?? {};
    if (myAnswers[String(idx)]) {
      return NextResponse.json({ error: "អ្នកបានឆ្លើយសំណួរនេះរួចហើយ។" }, { status: 409 });
    }
    const questionId = match.questionIds[idx];
    const question = questionId ? getQuizQuestion(questionId) : undefined;
    if (!question) {
      return NextResponse.json({ error: "សំណួរខូច។" }, { status: 500 });
    }

    const msTaken = receivedAt - match.currentQuestionStartedAt.getTime();
    const correct = choiceIndex === question.correctIndex;
    const points = computeAnswerPoints(correct, msTaken);

    await prisma.$transaction(
      async (tx) => {
        await tx.quizPlayer.update({
          where: { id: myRow.id },
          data: {
            score: { increment: points },
            answers: { ...myAnswers, [String(idx)]: { choice: choiceIndex, ms: msTaken } },
          },
        });

        const fresh = await tx.quizMatch.findUniqueOrThrow({ where: { id }, include: quizMatchInclude });
        const allAnswered = fresh.players.every((p) => {
          const a = (p.answers as StoredAnswers | null) ?? {};
          return Boolean(a[String(idx)]);
        });
        if (allAnswered) {
          await tryAdvanceQuizMatch(tx, id, idx, fresh.questionIds.length);
        } else if (msTaken > QUESTION_DURATION_MS) {
          // I was the last to answer but well past the deadline — still try
          // to advance in case the timeout route hasn't fired yet.
          await tryAdvanceQuizMatch(tx, id, idx, fresh.questionIds.length);
        }
      },
      // Prisma's default 5s transaction timeout isn't enough when this
      // call happens to be the one that finishes the match — completing
      // fans out into a sequential round-trip per player (points +
      // 2 mission bumps each) against a serverless Postgres connection,
      // confirmed to exceed 5s live with just 2 players in the room.
      { timeout: 20000 }
    );

    const updated = await prisma.quizMatch.findUniqueOrThrow({ where: { id }, include: quizMatchInclude });
    return NextResponse.json(toQuizMatchDetailDTO(updated, session.id));
  } catch {
    return NextResponse.json(
      { error: "មិនអាចកត់ត្រាចម្លើយបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
