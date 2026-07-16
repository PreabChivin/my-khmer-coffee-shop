import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toChatMessageDTO, chatMessageInclude } from "@/lib/chatDto";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { shouldAutoFlag } from "@/lib/chatModerationFilter";
import { getSticker } from "@/lib/stickers";
import type { ChatMessageDTO } from "@/lib/types";

const PAGE_SIZE = 50;
const MAX_TEXT_LENGTH = 500;
// ~1.2M base64 chars ≈ 900KB decoded — a hard ceiling above the client's
// ~100-250KB compressed output, so a tampered client still can't bloat rows.
const MAX_IMAGE_DATA_URL_CHARS = 1_200_000;
// A member counts as "typing" only if their heartbeat is this fresh —
// matches the client's ~2.5s debounce, so a closed tab goes quiet fast.
const TYPING_FRESHNESS_MS = 6000;

const messageInclude = chatMessageInclude;

/**
 * GET /api/chat/messages
 * - No `after` param: the latest PAGE_SIZE messages (initial load).
 * - `?after=<messageId>`: only messages newer than that one — this is the
 *   polling path, so a tick with nothing new is a tiny, cheap response.
 * Also returns who's currently typing (excluding the caller), piggybacked on
 * the same request so the poll loop never needs a second round trip.
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, false);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const afterId = request.nextUrl.searchParams.get("after");

  try {
    let afterCreatedAt: Date | undefined;
    if (afterId) {
      const cursor = await prisma.chatMessage.findUnique({
        where: { id: afterId },
        select: { createdAt: true },
      });
      afterCreatedAt = cursor?.createdAt;
    }

    const rows = await prisma.chatMessage.findMany({
      where: {
        deletedAt: null,
        ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}),
      },
      include: messageInclude,
      orderBy: { createdAt: afterCreatedAt ? "asc" : "desc" },
      take: afterCreatedAt ? undefined : PAGE_SIZE,
    });
    const ordered = afterCreatedAt ? rows : rows.reverse();
    const messages: ChatMessageDTO[] = ordered.map((row) => toChatMessageDTO(row, session.id));

    const typingSince = new Date(Date.now() - TYPING_FRESHNESS_MS);
    const typingRows = await prisma.chatTyping.findMany({
      where: { updatedAt: { gte: typingSince }, userId: { not: session.id } },
      select: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      messages,
      typingUsers: typingRows.map((r) => r.user),
    });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}

/**
 * POST /api/chat/messages
 * Body: { text?: string, imageUrl?: string } for a normal message, OR
 *       { stickerId: string } for a sticker (mutually exclusive with text/image).
 * Every registered member (customer or staff) can post to the shared room.
 * Plain-text messages are scanned by lib/chatModerationFilter.ts and
 * auto-flagged (never blocked) for the Admin Chat Monitor to review.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  let body: { text?: unknown; imageUrl?: unknown; stickerId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  // 💌 Sticker path — a fixed lib/stickers.ts id, no text/image alongside it.
  if (typeof body.stickerId === "string") {
    const sticker = getSticker(body.stickerId);
    if (!sticker) {
      return NextResponse.json({ error: "ស្ទីខឺមិនត្រឹមត្រូវទេ។" }, { status: 400 });
    }
    try {
      const created = await prisma.chatMessage.create({
        data: { userId: session.id, text: sticker.id, kind: "STICKER" },
        include: messageInclude,
      });
      await prisma.chatTyping.deleteMany({ where: { userId: session.id } }).catch(() => {});
      return NextResponse.json(toChatMessageDTO(created, session.id), { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "មិនអាចផ្ញើស្ទីខឺបានទេ សូមព្យាយាមម្តងទៀត។" },
        { status: 503 }
      );
    }
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;

  if (!text && !imageUrl) {
    return NextResponse.json(
      { error: "សូមសរសេរអ្វីមួយ ឬភ្ជាប់រូបភាព មុននឹងផ្ញើ។" },
      { status: 400 }
    );
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `សារវែងពេក (អតិបរមា ${MAX_TEXT_LENGTH} តួអក្សរ)។` },
      { status: 400 }
    );
  }
  // 🖼️ Accept either an https URL (legacy) or a compressed base64 image data
  // URL produced by the client uploader (lib/imageCompress.ts). The client
  // compresses to ~100-250KB, but that's bypassable, so re-cap the size here:
  // MAX_IMAGE_DATA_URL_CHARS of base64 ≈ 900KB decoded, comfortably above a
  // compressed image yet far below anything that would bloat the feed.
  if (imageUrl) {
    const isHttps = /^https:\/\/.+/.test(imageUrl);
    const isImageDataUrl = /^data:image\/(jpeg|png|webp|gif);base64,/.test(imageUrl);
    if (!isHttps && !isImageDataUrl) {
      return NextResponse.json(
        { error: "រូបភាពមិនត្រឹមត្រូវទេ។" },
        { status: 400 }
      );
    }
    if (isImageDataUrl && imageUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      return NextResponse.json(
        { error: "រូបភាពធំពេក សូមព្យាយាមម្តងទៀត។" },
        { status: 400 }
      );
    }
  }

  try {
    const created = await prisma.chatMessage.create({
      data: { userId: session.id, text, imageUrl, flagged: shouldAutoFlag(text) },
      include: messageInclude,
    });
    // Sending a message is itself proof of activity — clear any stale
    // "still typing" row so the sender doesn't appear to type their own echo.
    await prisma.chatTyping.deleteMany({ where: { userId: session.id } }).catch(() => {});

    return NextResponse.json(toChatMessageDTO(created, session.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចផ្ញើសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
