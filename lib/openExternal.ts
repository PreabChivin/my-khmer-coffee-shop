/**
 * 🔗 Open an external URL (e.g. a Telegram `t.me` deep link) in a way that
 * works in BOTH a normal browser and the Capacitor Android/iOS WebView.
 *
 * Why this exists: Capacitor's native WebView never enables multiple-window
 * support (`setSupportMultipleWindows` stays false and there is no
 * `onCreateWindow` handler), so `window.open(url, "_blank")` — and
 * `<a target="_blank">` clicks — are silently swallowed inside the app: the
 * tap does nothing. A same-frame navigation to a non-app host, by contrast,
 * is intercepted by Capacitor's Bridge (`shouldOverrideUrlLoading` →
 * `launchIntent`) and fired as an external `ACTION_VIEW` intent, so the target
 * app (Telegram) opens and the WebView stays on the current page.
 *
 * In a real browser we keep the original behavior exactly: a new tab via
 * `window.open` with `noopener,noreferrer`.
 */

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

/** True only inside the Capacitor native shell, where the runtime injects a
 *  `window.Capacitor` bridge. In a normal browser this is always false, so no
 *  web behavior changes. Zero-import + `window`-guarded, so it's safe during
 *  SSR and adds nothing to the web bundle. */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

/** Opens `url` in the OS (external browser / target app). Call from a user
 *  gesture (click handler) so the web `window.open` path isn't popup-blocked. */
export function openExternalUrl(url: string): void {
  if (isCapacitorNative()) {
    // Same-frame nav → Capacitor Bridge turns it into an external intent and
    // cancels the in-WebView load, so we don't navigate away from the app.
    window.location.assign(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * 🔔 Opens the Telegram bot's `/start` deep link with a payload
 * (`s_<device-token>` from the header, or a bare orderId from the
 * order/payment screens), platform-aware:
 *
 *   - Native (APK): `tg://resolve?domain=<bot>&start=<payload>` — an
 *     app-to-app intent that opens the installed Telegram app DIRECTLY and
 *     never touches the `t.me` web domain. Some ISPs (e.g. Metfone/Cambodia)
 *     DNS-block `t.me`, which would make the https link time out; `tg://`
 *     sidesteps that entirely. Telegram must be installed — which the user
 *     needs anyway to receive the DMs. Requires a `<queries>` entry for the
 *     `tg` scheme in AndroidManifest so the intent resolves on Android 11+.
 *
 *   - Web: `https://t.me/<bot>?start=<payload>` in a new tab, exactly as
 *     before — desktop/browser users have no `tg://` handler guaranteed.
 */
export function openTelegramBot(botUsername: string, startPayload: string): void {
  if (isCapacitorNative()) {
    window.location.assign(
      `tg://resolve?domain=${botUsername}&start=${encodeURIComponent(startPayload)}`
    );
  } else {
    window.open(
      `https://t.me/${botUsername}?start=${encodeURIComponent(startPayload)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
}
