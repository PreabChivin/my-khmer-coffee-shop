import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// 🔐 One unified session for every role (CUSTOMER, STAFF, ADMIN) — replaces
// the old separate admin_token/user_token cookies. lib/auth.ts and
// lib/customerAuth.ts re-export from here as thin, role-filtered
// compatibility shims so existing call sites don't need to change.
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_COOKIE_MAX_AGE });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    if (
      !decoded ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(
  request: NextRequest
): SessionPayload | null {
  // 📱 Mobile clients (React Native/Flutter) can't rely on httpOnly cookies
  // the way a browser does, so a Bearer token is checked first — same JWT,
  // same signing/verification, just carried differently. Every existing
  // protected route already calls this one function (via lib/auth.ts and
  // lib/customerAuth.ts), so this single change makes all of them
  // Bearer-token-capable with zero edits elsewhere. Cookie remains the
  // primary path for the web app.
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearerToken ?? request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
