import { prisma } from "@/lib/prisma";

const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * 🔗 Resolve a registered customer's Telegram chat id (for account-level DMs
 * like gifts / lucky-draw wins). We have no User→chat mapping, so we reuse the
 * most recent order of theirs that had Telegram linked. Returns null if they
 * never connected Telegram on any order.
 */
export async function resolveUserTelegramChatId(
  userId: string
): Promise<string | null> {
  try {
    const order = await prisma.order.findFirst({
      where: { userId, customerTelegramChatId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { customerTelegramChatId: true },
    });
    return order?.customerTelegramChatId ?? null;
  } catch {
    return null;
  }
}

/**
 * 🔔 sendCustomerAlert(): DMs a specific chat_id — captured either from a
 * past order's customerTelegramChatId, or from the device-session link
 * (TelegramSession, via the header's 🔔 connect button). Every send is
 * best-effort: a Telegram outage or missing config must never fail the
 * admin action it's attached to.
 */

async function callTelegramApi(
  method: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn(`[telegram] Skipped ${method} — TELEGRAM_BOT_TOKEN not configured.`);
    return false;
  }
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[telegram] ${method} failed (${res.status}): ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[telegram] ${method} threw:`, err);
    return false;
  }
}

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  return callTelegramApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
}

/** 💌 Private DM — sent to a specific customer's linked Telegram chat. */
export async function sendCustomerAlert(chatId: string, text: string): Promise<boolean> {
  return sendTelegramMessage(chatId, text);
}
