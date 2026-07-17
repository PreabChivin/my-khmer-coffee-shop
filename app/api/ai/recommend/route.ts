import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/customerAuth";
import { callPythonAi } from "@/lib/pythonAiBridge";

/**
 * POST /api/ai/recommend
 * Session-gated bridge to the Python recommender (POST /api/v1/ai/recommend).
 * The user_id is taken from the authenticated session, NOT the request body,
 * so a member can only ever ask for their OWN recommendations even though the
 * Python endpoint accepts an arbitrary id. Net-new; the live account page keeps
 * using /api/recommendations (TypeScript) so nothing breaks when Python is off.
 */
export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let limit = 3;
  try {
    const body = (await request.json()) as { limit?: unknown };
    if (typeof body.limit === "number" && body.limit >= 1 && body.limit <= 10) {
      limit = Math.floor(body.limit);
    }
  } catch {
    // empty/invalid body is fine — default limit applies
  }

  const result = await callPythonAi<unknown>("/api/v1/ai/recommend", {
    method: "POST",
    body: { user_id: session.id, limit },
  });

  if (result.ok) {
    return NextResponse.json(result.data);
  }
  if (result.notConfigured) {
    return NextResponse.json(
      { error: "Python AI service not configured.", fallback: "/api/recommendations" },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: result.error }, { status: 502 });
}
