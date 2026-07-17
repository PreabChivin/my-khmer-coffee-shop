"""Chat moderation — keyword/regex flagging for safe Gen-Z communication.

This is a deliberate PLACEHOLDER engine (per the brief), and it mirrors the
existing production TypeScript filter (`lib/chatModerationFilter.ts`) pattern
for pattern so the two stay in agreement. It is NOT an ML model — the roadmap
slot for a trained classifier lives here, but shipping a fake "AI" would just
be a confident guess, so we keep it honest, fast, and transparent.
"""

from __future__ import annotations

import re

# (pattern, human-readable reason) — reason is surfaced to moderators, never
# used to punish automatically.
_RISKY_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (
        re.compile(
            r"\b(send|transfer|ផ្ញើ|ដាក់ប្រាក់)\b.{0,20}\b(money|cash|ប្រាក់|khqr|telegram|wechat)\b",
            re.IGNORECASE,
        ),
        "possible off-platform payment solicitation",
    ),
    (
        re.compile(
            r"\b(dm me|whatsapp me|contact me at|click here|click this link)\b",
            re.IGNORECASE,
        ),
        "possible contact-harvesting / spam CTA",
    ),
    (
        re.compile(r"https?://(?!.*benchimin)\S+", re.IGNORECASE),
        "external link",
    ),
    (
        re.compile(r"(.)\1{9,}"),
        "spam-like character flooding",
    ),
]


def moderate(text: str) -> tuple[bool, list[str]]:
    """Return (flagged, reasons). Empty/whitespace text is never flagged."""
    if not text or not text.strip():
        return False, []
    reasons = [reason for pattern, reason in _RISKY_PATTERNS if pattern.search(text)]
    return (len(reasons) > 0), reasons
