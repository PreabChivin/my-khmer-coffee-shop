-- CreateTable
CREATE TABLE "PointsAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsAdjustment_userId_createdAt_idx" ON "PointsAdjustment"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Upgrade the two default base characters from the generic "capsule-figure"
-- placeholder to distinct "humanoid-male"/"humanoid-female" shapes (see
-- components/3d/AvatarCanvas3D.tsx) — more detailed procedural geometry
-- (legs, neck, simple facial features) with per-shape anchor offsets.
UPDATE "ShopItem" SET "model3d" = jsonb_set("model3d", '{shape}', '"humanoid-male"') WHERE "slug" = 'default-barista-boy';
UPDATE "ShopItem" SET "model3d" = jsonb_set("model3d", '{shape}', '"humanoid-female"') WHERE "slug" = 'default-barista-girl';
