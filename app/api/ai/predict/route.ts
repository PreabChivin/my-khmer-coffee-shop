import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { callPythonAi } from "@/lib/pythonAiBridge";

/**
 * GET /api/ai/predict
 * Admin-gated bridge to the Python analytics pipeline
 * (GET /api/v1/analytics/predict). This is a NET-NEW endpoint — the existing
 * dashboard keeps using /api/admin/analytics/predict (pure TypeScript), so
 * nothing depends on the Python sidecar being up. When the sidecar isn't
 * configured (e.g. Vercel prod), we return 503 with a clear pointer to the
 * canonical TS endpoint rather than silently reimplementing it here.
 */
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  const result = await callPythonAi<unknown>("/api/v1/analytics/predict", { method: "GET" });

  if (result.ok) {
    return NextResponse.json(result.data);
  }
  if (result.notConfigured) {
    return NextResponse.json(
      {
        error: "Python AI service not configured.",
        fallback: "/api/admin/analytics/predict",
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: result.error }, { status: 502 });
}
