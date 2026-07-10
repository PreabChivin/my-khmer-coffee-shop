-- 🔔 Telegram device session: maps a browser's localStorage token to a
-- Telegram chat_id, so a customer who connects once from the header has every
-- future order from that device auto-notified. Brand-new table, purely
-- additive — zero risk to existing data.
CREATE TABLE "TelegramSession" (
    "token" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("token")
);
