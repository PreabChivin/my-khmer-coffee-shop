import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCustomerAlert } from "@/lib/telegram";

// Telegram's own deep-link payload charset: A-Z a-z 0-9 _ and - (max 64
// chars) — this also happens to match our Order UUID format exactly.
const START_COMMAND = /^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?/;

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string };
  };
}

/**
 * 🔔 Telegram webhook — receives every message sent to the bot. Serverless
 * hosting rules out long-polling (no persistent process to run it), so this
 * is a webhook Telegram calls directly; register it once post-deploy with
 * setWebhook (see the deployment notes in the PR description).
 *
 * Always responds 200 so Telegram doesn't retry-storm a transient failure —
 * this is best-effort chat linking, not a payment-critical path.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    // Deliberately 401 (not 200) here — this is the one case worth Telegram
    // NOT retrying, since a bad secret will never become a good one.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;

    if (!text || chatId === undefined) {
      return NextResponse.json({ ok: true });
    }

    const match = text.match(START_COMMAND);
    if (match) {
      const payload = match[1];
      // "s_<token>" = device-session link from the header connect button
      // (saves to TelegramSession, keyed by the browser's localStorage
      // token); a bare payload = per-order link from the payment/tracking
      // screen (saves to that Order). Distinct prefix → no ambiguity.
      if (payload?.startsWith("s_")) {
        await handleSessionStart(String(chatId), payload.slice(2));
      } else {
        await handleStart(String(chatId), payload);
      }
    }
  } catch (err) {
    console.error("[telegram/webhook] Failed to process update:", err);
  }

  return NextResponse.json({ ok: true });
}

async function handleSessionStart(chatId: string, token: string) {
  // Tokens are client-generated UUIDs — sanity-check shape before storing.
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) {
    await sendCustomerAlert(
      chatId,
      "🥺 មានបញ្ហាបន្តិចនឹងការភ្ជាប់។ សូមព្យាយាមចុចប៊ូតុង 🔔 ម្តងទៀតណា៎ Bestie!"
    );
    return;
  }

  await prisma.telegramSession.upsert({
    where: { token },
    create: { token, chatId },
    update: { chatId },
  });

  await sendCustomerAlert(
    chatId,
    "🔔 ភ្ជាប់ជោគជ័យហើយណា៎! ចាប់ពីពេលនេះទៅ រាល់ការកម្ម៉ង់ដែលអ្នកកម្ម៉ង់ពីឧបករណ៍នេះ នឹងទទួលបានការជូនដំណឹងស្វ័យប្រវត្តិភ្លាមៗ! ☕️💖"
  );
}

async function handleStart(chatId: string, orderId: string | undefined) {
  if (!orderId) {
    await sendCustomerAlert(
      chatId,
      "👋 សួស្តី Bestie! ដើម្បីទទួលការជូនដំណឹងអំពីការកម្ម៉ង់ សូមចុចប៊ូតុង 🔔 នៅលើទំព័រតាមដានការកម្ម៉ង់ ឬនៅលើ Header របស់អ្នកណា៎! ☕️✨"
    );
    return;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    await sendCustomerAlert(
      chatId,
      "🥺 រកមិនឃើញការកម្ម៉ង់នេះទេ Bestie។ សូមចុចប៊ូតុងម្តងទៀតពីទំព័រតាមដានការកម្ម៉ង់របស់អ្នកណា៎!"
    );
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { customerTelegramChatId: chatId },
  });

  const shortId = orderId.slice(0, 8).toUpperCase();
  await sendCustomerAlert(
    chatId,
    `🔔 ភ្ជាប់ជោគជ័យហើយណា៎! ពួកយើងនឹងជូនដំណឹងអ្នកភ្លាមៗនៅពេលការកម្ម៉ង់ #${shortId} របស់អ្នកមានការផ្លាស់ប្តូរ ☕️💖`
  );
}
