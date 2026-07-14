import { NextResponse } from "next/server";

// 📱 Native mobile HTTP clients (React Native/Flutter) don't enforce CORS at
// all, so this is not required for them to work — but it's cheap, standard
// practice for a public API surface and unblocks any browser-based testing
// (Swagger-style explorers, a future web-based admin API console, etc.).
// Applied only to /api/v1/* — the existing web routes are same-origin and
// don't need it.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** Attaches CORS headers to a response — call at every v1 route's return point. */
export function withCors<T>(response: NextResponse<T>): NextResponse<T> {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/** Standard preflight reply — export `export const OPTIONS = corsPreflight;` from any v1 route. */
export function corsPreflight(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}
