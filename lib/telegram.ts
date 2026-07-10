import type { OrderStatus, OrderType } from "@/lib/types";

const TELEGRAM_API_BASE = "https://api.telegram.org";

/**
 * 🔔 Telegram Bot integration — dual channel:
 *   - sendStaffGroupAlert(): always TELEGRAM_CHAT_ID (the shared staff
 *     group). Never a customer's chat.
 *   - sendCustomerAlert(): always a specific chat_id captured from that
 *     customer's own /start deep-link click (Order.customerTelegramChatId).
 *     Never the staff group id.
 * Every send is best-effort: a Telegram outage or missing config must never
 * fail the order-status update or checkout flow it's attached to.
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

/** 📣 Group alert — new orders / payment-verification pings for staff. */
export async function sendStaffGroupAlert(text: string): Promise<boolean> {
  const groupChatId = process.env.TELEGRAM_CHAT_ID;
  if (!groupChatId) {
    console.warn("[telegram] Skipped staff group alert — TELEGRAM_CHAT_ID not configured.");
    return false;
  }
  return sendTelegramMessage(groupChatId, text);
}

/** 💌 Private DM — only ever called with an Order's own customerTelegramChatId. */
export async function sendCustomerAlert(chatId: string, text: string): Promise<boolean> {
  return sendTelegramMessage(chatId, text);
}

/** 🎉🍵🛵 Hyper-cute Khmer Gen-Z copy per order-status transition. Always
 *  Khmer regardless of the site's language toggle — this is a direct,
 *  personal ping, not a page render. */
export function buildCustomerStatusMessage(
  status: Extract<OrderStatus, "PREPARING" | "READY" | "COMPLETED" | "CANCELLED">,
  orderType: OrderType,
  shortOrderId: string
): string {
  const orderLabel = `ការកម្ម៉ង់ #${shortOrderId}`;

  switch (status) {
    case "PREPARING":
      return `🎉 ${orderLabel} ត្រូវបានអនុម័តហើយណា៎! បុគ្គលិក Cute Cute កំពុងចាប់ផ្តើមឆុងភ្លាមៗ ☕✨`;
    case "READY":
      return orderType === "Delivery"
        ? `🛵 កាហ្វេប្រូ/ស៊ីសឆុងរួចរាល់ហើយណា៎! កំពុងបញ្ជូនទៅដល់អ្នកឆាប់ៗនេះ Bestie! ☕️✨`
        : `☕️ កាហ្វេប្រូ/ស៊ីសឆុងរួចរាល់ហើយណា៎! ម៉កទទួលយកភាពស្រស់ស្រាយលឿនៗ Bestie! ☕️✨`;
    case "COMPLETED":
      return `💖 អរគុណច្រើនសម្រាប់ការគាំទ្រហាងកាហ្វេតូចនេះណា៎! សង្ឃឹមថាឆ្ងាញ់ម៉ៅដាច់! See you again, Bestie! 🧸✨`;
    case "CANCELLED":
      return `🥺 សុំទោសណា៎ Bestie — ${orderLabel} ត្រូវបានបោះបង់ចោល។ សូមទាក់ទងបុគ្គលិកបើមានចម្ងល់អី! 💌`;
  }
}
