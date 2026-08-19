-- CreateTable
CREATE TABLE "QuizMatch" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "questionIds" TEXT[],
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT -1,
    "currentQuestionStartedAt" TIMESTAMP(3),
    "rewardsGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizMatch_status_idx" ON "QuizMatch"("status");

-- CreateIndex
CREATE INDEX "QuizPlayer_matchId_idx" ON "QuizPlayer"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizPlayer_matchId_userId_key" ON "QuizPlayer"("matchId", "userId");

-- AddForeignKey
ALTER TABLE "QuizPlayer" ADD CONSTRAINT "QuizPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "QuizMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizPlayer" ADD CONSTRAINT "QuizPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
