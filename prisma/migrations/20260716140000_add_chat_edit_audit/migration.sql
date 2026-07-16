-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "isDeletedByUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalText" TEXT;
