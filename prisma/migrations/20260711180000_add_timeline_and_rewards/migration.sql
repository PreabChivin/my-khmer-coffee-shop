-- Loyalty & marketing suite: order-timeline timestamps, reward redemption
-- store, notification engine, monthly lucky draw, and user badges. Everything
-- is additive (nullable columns, defaulted columns, brand-new tables) so all
-- existing orders, users, and data are untouched — zero migration risk.

-- Order timeline stage timestamps
ALTER TABLE "Order" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "preparingAt" TIMESTAMP(3),
ADD COLUMN     "readyAt" TIMESTAMP(3);

-- User personalized badges (direct gift giver)
ALTER TABLE "User" ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Notification engine (broadcast + targeted)
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '📣',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Monthly lucky draw
CREATE TABLE "LuckyDraw" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prizeName" TEXT NOT NULL,
    "prizeEmoji" TEXT NOT NULL DEFAULT '🎁',
    "month" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL DEFAULT 0,
    "tierLabel" TEXT,
    "winnerId" TEXT,
    "winnerName" TEXT,
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LuckyDraw_pkey" PRIMARY KEY ("id")
);

-- Reward catalogue
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎁',
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- Redemption log
CREATE TABLE "RedemptionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT,
    "rewardName" TEXT NOT NULL,
    "rewardEmoji" TEXT NOT NULL DEFAULT '🎁',
    "cost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RedemptionHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "RedemptionHistory_userId_idx" ON "RedemptionHistory"("userId");
CREATE INDEX "RedemptionHistory_status_idx" ON "RedemptionHistory"("status");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RedemptionHistory" ADD CONSTRAINT "RedemptionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RedemptionHistory" ADD CONSTRAINT "RedemptionHistory_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
