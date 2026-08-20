-- CreateTable
CREATE TABLE "BattleDeck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardIds" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleMatch" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "turnUserId" TEXT,
    "winnerUserId" TEXT,
    "lastAction" JSONB,
    "rewardsGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattleMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattlePlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roster" JSONB NOT NULL,
    "activeIndex" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattlePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BattleDeck_userId_key" ON "BattleDeck"("userId");

-- CreateIndex
CREATE INDEX "BattleMatch_status_idx" ON "BattleMatch"("status");

-- CreateIndex
CREATE INDEX "BattlePlayer_matchId_idx" ON "BattlePlayer"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "BattlePlayer_matchId_userId_key" ON "BattlePlayer"("matchId", "userId");

-- AddForeignKey
ALTER TABLE "BattleDeck" ADD CONSTRAINT "BattleDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePlayer" ADD CONSTRAINT "BattlePlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "BattleMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePlayer" ADD CONSTRAINT "BattlePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
