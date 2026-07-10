-- Reverts the pre-order phone-based Telegram linking experiment. That
-- column was live for a few minutes behind a modal with a rendering bug
-- that blocked normal use the entire time, so no real data is lost here.
-- Telegram linking is order-based only: automatically on checkout confirm,
-- or manually from the order-tracking page (Order.customerTelegramChatId).
ALTER TABLE "LoyaltyAccount" DROP COLUMN "telegramChatId";
