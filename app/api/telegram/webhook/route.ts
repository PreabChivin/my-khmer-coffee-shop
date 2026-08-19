import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCustomerAlert } from "@/lib/telegram";

// Telegram's own deep-link payload charset: A-Z a-z 0-9 _ and - (max 64
// chars).
const START_COMMAND = /^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?/;

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string; username?: string };
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
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;
    const username = update.message?.chat?.username;

    if (!text || chatId === undefined) {
      return NextResponse.json({ ok: true });
    }

    const match = text.match(START_COMMAND);
    if (match) {
      const payload = match[1];
      // "s_<token>" = device-session link from the header connect button
      // (saves to TelegramSession, keyed by the browser's localStorage
      // token) — the only deep-link shape this app generates.
      if (payload?.startsWith("s_")) {
        await handleSessionStart(String(chatId), payload.slice(2), username);
      } else {
        await sendCustomerAlert(
          String(chatId),
          "👋 សួស្តី Bestie! ដើម្បីទទួលការជូនដំណឹង សូមចុចប៊ូតុង 🔔 នៅលើ Header របស់អ្នកណា៎! 🕹️✨"
        );
      }
    }
  } catch (err) {
    console.error("[telegram/webhook] Failed to process update:", err);
  }

  return NextResponse.json({ ok: true });
}

async function handleSessionStart(chatId: string, token: string, username?: string) {
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
    create: { token, chatId, username },
    update: { chatId, username },
  });

  await sendCustomerAlert(
    chatId,
    "🔔 ភ្ជាប់ជោគជ័យហើយណា៎! ចាប់ពីពេលនេះទៅ អ្នកនឹងទទួលបានការជូនដំណឹងស្វ័យប្រវត្តិភ្លាមៗ! 🕹️💖"
  );
}
