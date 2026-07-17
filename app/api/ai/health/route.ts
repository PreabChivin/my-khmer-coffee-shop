import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { callPythonAi, isConfigured } from "@/lib/pythonAiBridge";

/**
 * GET /api/ai/health
 * Admin-gated status probe for the Hybrid AI service card on the dashboard.
 * Reports whether the Python sidecar is (a) configured and (b) actually
 * reachable right now. Never errors — an offline sidecar is a normal state.
 */
interface PyHealth {
  status: string;
  service: string;
  db_connected: boolean;
  version: string;
}

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  if (!isConfigured()) {
    return NextResponse.json({
      connected: false,
      configured: false,
      message: "Python AI service not configured — Next.js is using its built-in TypeScript logic.",
    });
  }

  const result = await callPythonAi<PyHealth>("/health", { method: "GET", timeoutMs: 4000 });
  if (result.ok) {
    return NextResponse.json({
      connected: true,
      configured: true,
      dbConnected: result.data.db_connected,
      version: result.data.version,
    });
  }

  return NextResponse.json({
    connected: false,
    configured: true,
    message: result.notConfigured ? "not configured" : result.error,
  });
}
