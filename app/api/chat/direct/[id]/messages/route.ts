import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { checkChatModeration, moderationErrorBody } from "@/lib/chatModeration";
import { shouldAutoFlag } from "@/lib/chatModerationFilter";
import { getSticker } from "@/lib/stickers";
import { assertConversationParticipant } from "@/lib/directChatAccess";
import { toDirectMessageDTO } from "@/lib/directChatDto";
import type { DirectMessageDTO } from "@/lib/types";

const PAGE_SIZE = 50;
const MAX_TEXT_LENGTH = 500;
const MAX_IMAGE_DATA_URL_CHARS = 1_200_000;

/**
 * GET /api/chat/direct/[id]/messages
 * Same cursor convention as the shared room (no `after` = latest PAGE_SIZE;
 * `?after=<id>` = polling path, only newer messages). Isolation is enforced
 * by assertConversationParticipant BEFORE any message row is ever queried —
 * a member who isn't one of the two participants gets a 404, identical to a
 * conversation that doesn't exist at all.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, false);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id: conversationId } = await params;
  const access = await assertConversationParticipant(conversationId, session.id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const afterId = request.nextUrl.searchParams.get("after");

  try {
    let afterCreatedAt: Date | undefined;
    if (afterId) {
      const cursor = await prisma.directMessage.findUnique({
        where: { id: afterId },
        select: { createdAt: true },
      });
      afterCreatedAt = cursor?.createdAt;
    }

    const rows = await prisma.directMessage.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}),
      },
      orderBy: { createdAt: afterCreatedAt ? "asc" : "desc" },
      take: afterCreatedAt ? undefined : PAGE_SIZE,
    });
    const ordered = afterCreatedAt ? rows : rows.reverse();
    const messages: DirectMessageDTO[] = ordered.map((row) => toDirectMessageDTO(row, session.id));

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}

/**
 * POST /api/chat/direct/[id]/messages
 * Body: { text?: string, imageUrl?: string } or { stickerId: string } —
 * identical shape/limits to the shared room's POST /api/chat/messages, same
 * mute/ban gate, same auto-flag. Also bumps DirectConversation.updatedAt (via
 * a second write in the same operation) so the "Active Private Chats" list
 * re-sorts without a separate join.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const modCheck = await checkChatModeration(session.id, true);
  if (modCheck.blocked) {
    return NextResponse.json(moderationErrorBody(modCheck), { status: 403 });
  }

  const { id: conversationId } = await params;
  const access = await assertConversationParticipant(conversationId, session.id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { text?: unknown; imageUrl?: unknown; stickerId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  if (typeof body.stickerId === "string") {
    const sticker = getSticker(body.stickerId);
    if (!sticker) {
      return NextResponse.json({ error: "ស្ទីខឺមិនត្រឹមត្រូវទេ។" }, { status: 400 });
    }
    try {
      const [created] = await prisma.$transaction([
        prisma.directMessage.create({
          data: { conversationId, senderId: session.id, text: sticker.id, kind: "STICKER" },
        }),
        prisma.directConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);
      return NextResponse.json(toDirectMessageDTO(created, session.id), { status: 201 });
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
  if (imageUrl) {
    const isHttps = /^https:\/\/.+/.test(imageUrl);
    const isImageDataUrl = /^data:image\/(jpeg|png|webp|gif);base64,/.test(imageUrl);
    if (!isHttps && !isImageDataUrl) {
      return NextResponse.json({ error: "រូបភាពមិនត្រឹមត្រូវទេ។" }, { status: 400 });
    }
    if (isImageDataUrl && imageUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      return NextResponse.json({ error: "រូបភាពធំពេក សូមព្យាយាមម្តងទៀត។" }, { status: 400 });
    }
  }

  try {
    const [created] = await prisma.$transaction([
      prisma.directMessage.create({
        data: {
          conversationId,
          senderId: session.id,
          text,
          imageUrl,
          flagged: shouldAutoFlag(text),
        },
      }),
      prisma.directConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    return NextResponse.json(toDirectMessageDTO(created, session.id), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "មិនអាចផ្ញើសារបានទេ សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
