-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gameLosses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameTies" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameWins" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "gameSessionId" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'TEXT';

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "gameType" TEXT NOT NULL DEFAULT 'TICTACTOE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "winnerId" TEXT,
    "isTie" BOOLEAN NOT NULL DEFAULT false,
    "gameState" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
