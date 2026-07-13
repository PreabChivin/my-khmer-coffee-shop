// Back-compat aliases over the unified session module (lib/session.ts) —
// every existing customer-facing route imports these exact names.
export {
  SESSION_COOKIE_NAME as USER_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE as USER_COOKIE_MAX_AGE,
  signSessionToken as signUserToken,
  getSessionFromRequest as getUserFromRequest,
} from "@/lib/session";
export type { SessionPayload as UserTokenPayload } from "@/lib/session";
