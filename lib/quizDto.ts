import type { QuizMatch, QuizPlayer, User } from "@prisma/client";
import { getQuizQuestion } from "@/lib/quizQuestions";
import { QUESTION_DURATION_MS } from "@/lib/quizEngine";
import type { QuizMatchDetailDTO, QuizMatchStatus, QuizPlayerDTO, QuizQuestionDTO } from "@/lib/types";

type StoredAnswer = { choice: number; ms: number };
type StoredAnswers = Record<string, StoredAnswer>;

type MatchWithPlayers = QuizMatch & {
  players: (QuizPlayer & { user: Pick<User, "id" | "name"> })[];
};

/** Prisma include for a match with every player's public fields. */
export const quizMatchInclude = {
  players: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
} as const;

function answersOf(player: QuizPlayer): StoredAnswers {
  return (player.answers as StoredAnswers | null) ?? {};
}

export function toQuizMatchDetailDTO(match: MatchWithPlayers, viewerId: string): QuizMatchDetailDTO {
  const idx = match.currentQuestionIndex;
  const currentQuestionId = idx >= 0 && idx < match.questionIds.length ? match.questionIds[idx] : null;
  const bankQuestion = currentQuestionId ? getQuizQuestion(currentQuestionId) : undefined;

  const viewerRow = match.players.find((p) => p.userId === viewerId);
  const viewerAnswers = viewerRow ? answersOf(viewerRow) : {};
  const viewerAnsweredCurrent = idx >= 0 ? Boolean(viewerAnswers[String(idx)]) : false;

  const players: QuizPlayerDTO[] = match.players.map((p) => {
    const answers = answersOf(p);
    return {
      id: p.userId,
      name: p.user.name,
      score: p.score,
      hasAnsweredCurrent: idx >= 0 ? Boolean(answers[String(idx)]) : false,
    };
  });

  let question: QuizQuestionDTO | null = null;
  if (bankQuestion && match.status === "ACTIVE") {
    question = {
      index: idx,
      totalQuestions: match.questionIds.length,
      category: bankQuestion.category,
      textKm: bankQuestion.textKm,
      choicesKm: bankQuestion.choicesKm,
      // Safe once I've locked in my own answer — no more peeking risk for
      // me specifically, even while others are still deciding.
      correctIndex: viewerAnsweredCurrent ? bankQuestion.correctIndex : null,
      myChoice: viewerAnsweredCurrent ? viewerAnswers[String(idx)].choice : null,
    };
  }

  const podium = match.status === "COMPLETED" ? [...players].sort((a, b) => b.score - a.score) : null;

  return {
    id: match.id,
    status: match.status as QuizMatchStatus,
    capacity: match.capacity,
    players,
    question,
    questionDeadlineAt:
      match.status === "ACTIVE" && match.currentQuestionStartedAt
        ? new Date(match.currentQuestionStartedAt.getTime() + QUESTION_DURATION_MS).toISOString()
        : null,
    myUserId: viewerId,
    podium,
  };
}
