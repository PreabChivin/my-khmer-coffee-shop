import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

const MAX_IDS_PER_REQUEST = 200;

/**
 * POST /api/admin/chat/messages/clear
 * Body: { ids: string[] }
 * ADMIN only (mirrors the severity of the account-purge route — this is a
 * real, irreversible DELETE, not the soft-delete every other moderation
 * action uses). Removes the selected messages entirely, cascading their
 * reactions; any GAME_INVITE/GAME_RESULT rows just lose their chat-log
 * entry, the underlying GameSession/scoreboard is untouched.
 */
export async function POST(request: NextRequest) {
  const session = requireAdminRole(request);
  if (!session) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "សូមជ្រើសរើសសារយ៉ាងហោចណាស់មួយ។" }, { status: 400 });
  }
  if (ids.length > MAX_IDS_PER_REQUEST) {
    return NextResponse.json(
      { error: `អាចលុបបានតែ ${MAX_IDS_PER_REQUEST} សារក្នុងមួយដង។` },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.chatMessage.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deletedCount: result.count });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចលុបសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
