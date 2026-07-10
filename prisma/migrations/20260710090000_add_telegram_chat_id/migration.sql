-- Telegram Deep Linking: adds a nullable chat_id column to Order. Purely
-- additive — no backfill needed, existing rows simply get NULL (meaning
-- "not linked yet"), so this is safe to apply with zero risk to existing data.
ALTER TABLE "Order" ADD COLUMN "customerTelegramChatId" TEXT;
