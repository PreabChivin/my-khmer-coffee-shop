import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toUserDTO } from "@/lib/userDto";

// ~1.4M base64 chars ≈ 1MB decoded — well above the client's compressed
// ~15-60KB avatar output, but a hard ceiling in case a tampered client skips
// compression. The ORIGINAL file is capped at 3MB client-side
// (lib/imageCompress.ts maxSourceBytes) per this feature's spec; this is a
// second, independent server-side check — never trust the client alone.
const MAX_AVATAR_DATA_URL_CHARS = 1_400_000;

/**
 * POST /api/auth/avatar
 * Body: { avatarUrl: string | null } — a compressed base64 JPEG data URL from
 * lib/imageCompress.ts, or null to remove the current picture. Same storage
 * pattern as ChatMessage.imageUrl (no object storage service). Updates
 * User.avatarUrl, which every existing chat query already selects, so the
 * new picture appears next to the member's messages on the next poll tick —
 * no chat-specific wiring needed here.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { avatarUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  // Explicit null clears the avatar; omitted/anything else is a validation error.
  if (body.avatarUrl === null) {
    try {
      const user = await prisma.user.update({
        where: { id: session.id },
        data: { avatarUrl: null },
      });
      return NextResponse.json({ user: toUserDTO(user) });
    } catch {
      return NextResponse.json(
        { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
        { status: 503 }
      );
    }
  }

  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : "";
  const isImageDataUrl = /^data:image\/(jpeg|png|webp);base64,/.test(avatarUrl);
  if (!isImageDataUrl) {
    return NextResponse.json({ error: "រូបភាពមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  if (avatarUrl.length > MAX_AVATAR_DATA_URL_CHARS) {
    return NextResponse.json({ error: "ទំហំរូបភាពធំពេក។" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.id },
      data: { avatarUrl },
    });
    return NextResponse.json({ user: toUserDTO(user) });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
