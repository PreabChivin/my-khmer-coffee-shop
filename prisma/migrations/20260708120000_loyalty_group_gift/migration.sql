
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "giftMessage" TEXT,
ADD COLUMN     "giftRecipientName" TEXT,
ADD COLUMN     "giftRedeemed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGroupOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redeemedFreeDrinks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "contributorName" TEXT;

-- CreateTable
CREATE TABLE "LoyaltyAccount" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "stampCount" INTEGER NOT NULL DEFAULT 0,
    "freeDrinksRedeemed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupCart" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupCartItem" (
    "id" TEXT NOT NULL,
    "groupCartId" TEXT NOT NULL,
    "contributorName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "customizations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyAccount_phone_key" ON "LoyaltyAccount"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "GroupCart_orderId_key" ON "GroupCart"("orderId");

-- AddForeignKey
ALTER TABLE "GroupCartItem" ADD CONSTRAINT "GroupCartItem_groupCartId_fkey" FOREIGN KEY ("groupCartId") REFERENCES "GroupCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupCartItem" ADD CONSTRAINT "GroupCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

