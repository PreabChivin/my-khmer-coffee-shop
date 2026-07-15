-- AlterTable
ALTER TABLE "User" ADD COLUMN     "chatBannedAt" TIMESTAMP(3),
ADD COLUMN     "chatMutedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
