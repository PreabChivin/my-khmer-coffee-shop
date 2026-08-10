-- AlterTable
ALTER TABLE "ShopItem" DROP COLUMN "model3d",
ADD COLUMN     "imageOffset" JSONB,
ADD COLUMN     "imageUrl" TEXT;

