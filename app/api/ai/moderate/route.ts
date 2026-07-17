import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/customerAuth";
import { callPythonAi, isConfigured } from "@/lib/pythonAiBridge";
import { shouldAutoFlag } from "@/lib/chatModerationFilter";

/**
 * POST /api/ai/moderate
 * Session-gated bridge to the Python moderation engine
 * (POST /api/v1/chat/moderate). Unlike predict/recommend, this one FALLS BACK
 * to the existing in-process TypeScript filter (lib/chatModerationFilter.ts)
 * when the Python sidecar isn't configured — so the endpoint is always
 * functional, and `source` tells the caller which engine actually ran.
 */
interface PyModerate {
  flagged: boolean;
  reasons: string[];
  text_length: number;
}

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let text = "";
  try {
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text === "string") text = body.text;
  } catch {
    // treat as empty text
  }

  // Prefer the Python engine when available.
  if (isConfigured()) {
    const result = await callPythonAi<PyModerate>("/api/v1/chat/moderate", {
      method: "POST",
      body: { text },
    });
    if (result.ok) {
      return NextResponse.json({ ...result.data, source: "python" });
    }
    // fall through to the built-in filter on any upstream failure
  }

  // Built-in TypeScript fallback — always available.
  return NextResponse.json({
    flagged: shouldAutoFlag(text),
    reasons: [],
    text_length: text.length,
    source: "builtin-typescript",
  });
}
