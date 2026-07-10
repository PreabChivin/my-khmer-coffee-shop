-- Pre-order Telegram Deep Linking: nullable chat_id on LoyaltyAccount, keyed
-- by phone (the only persistent customer identity this app has). Purely
-- additive — existing rows get NULL ("not linked"), zero risk to existing data.
ALTER TABLE "LoyaltyAccount" ADD COLUMN "telegramChatId" TEXT;
