-- CreateTable
CREATE TABLE "CreatureCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "baseCp" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "isShiny" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatureCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatureCard_userId_idx" ON "CreatureCard"("userId");

-- CreateIndex
CREATE INDEX "CreatureCard_userId_speciesId_idx" ON "CreatureCard"("userId", "speciesId");

-- AddForeignKey
ALTER TABLE "CreatureCard" ADD CONSTRAINT "CreatureCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
