/**
 * 🐍🔌 Server-side bridge to the decoupled Python AI & Analytics microservice
 * (see backend-py/). This is the ONLY place the Next.js app talks to Python.
 *
 * It is env-gated on purpose:
 *   - PYTHON_AI_SERVICE_URL    — base URL of the running FastAPI service
 *   - PYTHON_AI_SERVICE_SECRET — shared secret sent as X-Internal-Api-Key
 *
 * When those are UNSET (e.g. the current Vercel production, which can't host a
 * long-lived Uvicorn process), `isConfigured()` is false and callers fall back
 * gracefully — so shipping this never breaks prod. When they ARE set (local dev
 * or a separate Python host), calls proxy straight through.
 *
 * Never import this from client components — it reads server-only secrets.
 */

const SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL;
const SERVICE_SECRET = process.env.PYTHON_AI_SERVICE_SECRET;
const DEFAULT_TIMEOUT_MS = 8000;

export function isConfigured(): boolean {
  return Boolean(SERVICE_URL && SERVICE_SECRET);
}

export type BridgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; notConfigured: true }
  | { ok: false; notConfigured: false; status: number; error: string };

/**
 * Calls the Python service. Returns a discriminated result rather than
 * throwing, so route handlers can branch cleanly (proxy hit / not configured /
 * upstream error) without try/catch noise at every call site.
 */
export async function callPythonAi<T>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number }
): Promise<BridgeResult<T>> {
  if (!isConfigured()) {
    return { ok: false, notConfigured: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${SERVICE_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Api-Key": SERVICE_SECRET as string,
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        notConfigured: false,
        status: res.status,
        error: detail || `Python service returned ${res.status}`,
      };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { ok: false, notConfigured: false, status: 502, error: `Python service unreachable: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}
