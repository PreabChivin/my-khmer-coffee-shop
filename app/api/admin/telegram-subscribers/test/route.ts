import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFromRequest } from "@/lib/auth";
import { sendCustomerAlert } from "@/lib/telegram";

const schema = z.object({
  chatId: z.string().trim().min(1).max(64),
  message: z.string().trim().max(500).optional(),
});

const DEFAULT_MESSAGE =
  "🧪 នេះជាសារសាកល្បងពី BENCHIMIN CAFE — ប្រសិនបើអ្នកឃើញសារនេះ ការភ្ជាប់ Telegram របស់អ្នកដំណើរការល្អហើយ! ☕️💖";

/** POST /api/admin/telegram-subscribers/test — Body: { chatId, message? }
 *  Sends a one-off Telegram DM to any discovered chat id (connected to a
 *  registered account or not), so staff can confirm the bot can actually
 *  reach it before relying on it for order notifications. */
export async function POST(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ទិន្នន័យមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  const sent = await sendCustomerAlert(parsed.data.chatId, parsed.data.message || DEFAULT_MESSAGE);
  if (!sent) {
    return NextResponse.json(
      { error: "មិនអាចផ្ញើសារបានទេ — សូមពិនិត្យ chat_id ឬការកំណត់ Bot Token។" },
      { status: 502 }
    );
  }
  return NextResponse.json({ success: true });
}
