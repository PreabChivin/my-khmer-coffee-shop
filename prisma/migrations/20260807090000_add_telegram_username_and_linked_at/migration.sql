-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerTelegramUsername" TEXT,
ADD COLUMN     "telegramLinkedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TelegramSession" ADD COLUMN     "username" TEXT;

