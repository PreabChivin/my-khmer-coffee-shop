// 🗺️ Shared Nominatim (OpenStreetMap) request helper for the geocode API
// routes. All calls to the third-party service go through the server (never
// the browser directly) — matches this app's existing pattern for external
// APIs (see lib/telegram.ts) and lets a User-Agent be set as Nominatim's
// usage policy requires.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "BenChimin-Cafe-Website/1.0 (contact: admin@benchimin.cafe)";
const TIMEOUT_MS = 5000;

export async function nominatimFetch(path: string): Promise<Response> {
  return fetch(`${NOMINATIM_BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}
