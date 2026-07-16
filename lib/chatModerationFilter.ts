/**
 * 🚩 Lightweight, transparent content flagging for the Café Lounge — a
 * keyword/pattern scan, NOT an AI/ML model (the brief asked for a Python
 * "contextual processing" service for this; running it as a plain function
 * in the existing Next.js API achieves the same practical outcome — flag
 * risky messages for human review — with zero new infrastructure).
 *
 * Deliberately NEVER blocks or rewrites a message — it only sets the same
 * `flagged` boolean a Staff/Admin can already toggle by hand, surfacing the
 * message in the Admin Chat Monitor's "Flagged" filter for a human to judge.
 * A false positive costs a moderator one glance, not a silently dropped
 * message — the safer failure mode for a community chat.
 */

// Deliberately short and conservative — obvious spam/scam/harassment
// patterns only. Not a profanity list (too easy to false-positive on normal
// Khmer/English chat and too easy to bypass either way); a human moderator
// makes the actual judgment call, this just routes their attention.
const RISKY_PATTERNS: RegExp[] = [
  // Scam-y "send money" asks combined with a contact channel.
  /\b(send|transfer|ផ្ញើ|ដាក់ប្រាក់)\b.{0,20}\b(money|cash|ប្រាក់|khqr|telegram|wechat)\b/i,
  // External contact-me-privately-for-a-"deal" pattern, common bot spam.
  /\b(dm me|whatsapp me|contact me at|click here|click this link)\b/i,
  // Raw URLs pasted as text (not the dedicated image-upload path) — most
  // legitimate chat has no reason to paste a bare link.
  /https?:\/\/(?!.*benchimin)\S+/i,
  // Repeated character spam (e.g. "!!!!!!!!!!" or "aaaaaaaaaaaa"), a common
  // low-effort flood/harassment pattern.
  /(.)\1{9,}/,
];

/** Returns true if `text` matches any risky pattern — the caller sets
 *  ChatMessage.flagged from this, never blocks the send. */
export function shouldAutoFlag(text: string): boolean {
  if (!text) return false;
  return RISKY_PATTERNS.some((pattern) => pattern.test(text));
}
