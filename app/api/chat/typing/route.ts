import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration } from "@/lib/chatModeration";

/**
 * POST /api/chat/typing
 * Heartbeat — the client calls this on a short debounce (~2.5s) while the
 * composer has text, and stops calling it on blur/send. GET /api/chat/messages
 * reports anyone whose heartbeat is still fresh (see TYPING_FRESHNESS_MS) as
 * "typing", so a silently closed tab just goes stale with no cleanup job.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  // Muted/banned members just don't get a typing row — best-effort endpoint,
  // no need to surface a 403 for a purely cosmetic indicator.
  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json({ success: false });
  }

  try {
    await prisma.chatTyping.upsert({
      where: { userId: session.id },
      create: { userId: session.id },
      update: {},
    });
    return NextResponse.json({ success: true });
  } catch {
    // Best-effort — a failed heartbeat should never surface as a user-facing error.
    return NextResponse.json({ success: false });
  }
}
