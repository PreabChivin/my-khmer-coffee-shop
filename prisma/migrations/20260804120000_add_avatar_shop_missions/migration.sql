-- CreateEnum
CREATE TYPE "ShopItemCategory" AS ENUM ('HAT', 'EYEWEAR', 'OUTFIT', 'HANDHELD');

-- CreateEnum
CREATE TYPE "ShopItemTier" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "category" "ShopItemCategory" NOT NULL,
    "tier" "ShopItemTier" NOT NULL DEFAULT 'COMMON',
    "cost" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMissionProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionKey" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "progressCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMissionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_slug_key" ON "ShopItem"("slug");

-- CreateIndex
CREATE INDEX "UserInventory_userId_idx" ON "UserInventory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_userId_itemId_key" ON "UserInventory"("userId", "itemId");

-- CreateIndex
CREATE INDEX "UserMissionProgress_userId_periodKey_idx" ON "UserMissionProgress"("userId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserMissionProgress_userId_missionKey_periodKey_key" ON "UserMissionProgress"("userId", "missionKey", "periodKey");

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInventory" ADD CONSTRAINT "UserInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShopItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMissionProgress" ADD CONSTRAINT "UserMissionProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed starter Avatar Shop catalog (16 items, 4 per category, all 4 tiers
-- represented). ON CONFLICT guards re-running this migration accidentally.
INSERT INTO "ShopItem" ("id", "slug", "name", "nameKh", "category", "tier", "cost", "emoji", "description", "isAvailable", "createdAt", "updatedAt") VALUES
  ('91942351-423f-4548-abe4-a42f769b35d0', 'coffee-bean-cap', 'Coffee Bean Cap', 'មួកគ្រាប់កាហ្វេ', 'HAT', 'COMMON', 40, '🧢', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('4766c3af-e769-4813-8cc0-1916efbe9630', 'graduate-cap', 'Graduate Cap', 'មួកបញ្ចប់ការសិក្សា', 'HAT', 'COMMON', 50, '🎓', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('80f5aeb1-b8e8-4f12-9c5a-e5f77af8bb77', 'dapper-top-hat', 'Dapper Top Hat', 'មួកអ្នកមានទឹកមុខ', 'HAT', 'RARE', 120, '🎩', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6102b2a0-9ba2-4105-a3d9-8c124bfdb480', 'golden-crown', 'Golden Crown', 'មកុដមាស', 'HAT', 'LEGENDARY', 500, '👑', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('01f16ffa-db72-4ea5-878c-96eb36a99b02', 'nerd-glasses', 'Nerd Glasses', 'វ៉ែនតាបញ្ញវន្ត', 'EYEWEAR', 'COMMON', 35, '👓', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ffabec38-2f46-49d1-bdcc-c81e50d820e2', 'cool-sunglasses', 'Cool Sunglasses', 'វ៉ែនតាការពារកម្ដៅ', 'EYEWEAR', 'COMMON', 40, '🕶️', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('7bab6b9c-a931-4a37-8219-1d2630ab696d', 'barista-goggles', 'Barista Goggles', 'វ៉ែនតាការពារបារីស្តា', 'EYEWEAR', 'RARE', 110, '🥽', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ce767a51-4699-4c41-b7f7-671bb1a54fd6', 'sparkle-vision', 'Sparkle Vision', 'ភ្នែកចែងចាំង', 'EYEWEAR', 'EPIC', 250, '✨', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('df1792fe-89d2-4b76-b457-e5824b3cb534', 'barista-apron', 'Barista Apron', 'អាវការពាររបស់បារីស្តា', 'OUTFIT', 'COMMON', 45, '🧑‍🍳', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('06cef403-96e5-4dcd-b067-fb19dd78ecfb', 'cozy-hoodie', 'Cozy Hoodie', 'អាវហ៊្គូឌីកក់ក្ដៅ', 'OUTFIT', 'COMMON', 45, '🧥', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('06216fc5-46e3-454f-b0c1-2ac6868b394c', 'party-dress', 'Party Dress', 'រ៉ូបពិធីជប់លៀង', 'OUTFIT', 'RARE', 130, '👗', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('6c75dea4-9951-49d8-8fcf-6de24ca6f8a2', 'ninja-gi', 'Ninja Gi', 'សម្លៀកបំពាក់និនចា', 'OUTFIT', 'EPIC', 260, '🥋', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cf070614-4b9a-457d-a56d-c0d02b6f3a79', 'classic-coffee-cup', 'Classic Coffee Cup', 'ពែងកាហ្វេបុរាណ', 'HANDHELD', 'COMMON', 35, '☕', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('261c9e91-3e13-458b-9764-07590aad5dae', 'boba-cup', 'Boba Cup', 'ពែងតែពុះពងត្រី', 'HANDHELD', 'COMMON', 40, '🧋', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('e6260cb1-7081-489c-b8c4-b4ff2a633252', 'baristas-wand', 'Barista''s Wand', 'ដំបងវេទមន្តរបស់បារីស្តា', 'HANDHELD', 'EPIC', 240, '🪄', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('2f6b83ab-d60e-477d-98d8-76061a8a50c5', 'golden-mug', 'Golden Mug', 'ពែងមាស', 'HANDHELD', 'LEGENDARY', 480, '🏆', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
