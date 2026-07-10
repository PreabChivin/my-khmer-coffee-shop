/**
 * 🔔 Telegram device-session token — a stable per-browser identifier stored
 * in localStorage. The header "connect" button embeds it in the bot deep
 * link (/start s_<token>); the webhook saves the customer's chat_id against
 * it; checkout reads it back and auto-links every future order from this
 * device. No phone number, no per-order re-linking.
 */
const STORAGE_KEY = "cafe-tg-session";

/** Reads the existing token, creating and persisting one if absent. Called
 *  from the header connect button (a user gesture), so localStorage is
 *  available. Falls back to an ephemeral token if storage is blocked. */
export function getOrCreateTelegramSessionToken(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

/** Read-only lookup used at checkout — returns null if the customer never
 *  connected from this device (so we simply don't attach a chat). */
export function getTelegramSessionToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
