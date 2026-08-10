import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { getTelegramSubscriberStats } from "@/lib/telegramSubscribers";

/** GET /api/admin/telegram-subscribers — counts + the full per-customer
 *  Telegram connection list for the admin dashboard. See
 *  lib/telegramSubscribers.ts for how connection status is derived. */
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  try {
    const body = await getTelegramSubscriberStats();
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
