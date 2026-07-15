import { prisma } from "@/lib/prisma";

export type ChatModerationCheck =
  | { blocked: false }
  | { blocked: true; reason: "BANNED" | "MUTED"; until?: string };

/**
 * 🔇 Live moderation check for the Café Lounge — deliberately a DB read (not
 * baked into the session JWT) so a mute/ban set by an Admin takes effect on
 * the member's very next request instead of waiting for them to log back in.
 * `forWrite` distinguishes read (GET) from write (POST/react/typing) — a mute
 * only blocks writes, a ban blocks everything.
 */
export async function checkChatModeration(
  userId: string,
  forWrite: boolean
): Promise<ChatModerationCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { chatBannedAt: true, chatMutedUntil: true },
  });
  if (!user) return { blocked: false };

  if (user.chatBannedAt) {
    return { blocked: true, reason: "BANNED" };
  }
  if (forWrite && user.chatMutedUntil && user.chatMutedUntil.getTime() > Date.now()) {
    return { blocked: true, reason: "MUTED", until: user.chatMutedUntil.toISOString() };
  }
  return { blocked: false };
}

/** Standard Khmer error body for a blocked moderation check. */
export function moderationErrorBody(check: Extract<ChatModerationCheck, { blocked: true }>) {
  if (check.reason === "BANNED") {
    return { error: "គណនីរបស់អ្នកត្រូវបានហាមឃាត់មិនឲ្យប្រើប្រាស់ការជជែកនេះទេ។", code: "CHAT_BANNED" };
  }
  const untilLabel = check.until
    ? new Date(check.until).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
  return {
    error: `អ្នកត្រូវបានផ្អាកការសរសេរសារបណ្តោះអាសន្ន រហូតដល់ ${untilLabel}។`,
    code: "CHAT_MUTED",
  };
}
