import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

// Customer sessions reuse the same signing secret + JWT-cookie pattern as the
// staff `Admin` auth (lib/auth.ts), but with a SEPARATE cookie so a customer
// session can never be mistaken for a staff session and vice-versa.
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
export const USER_COOKIE_NAME = "user_token";
export const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface UserTokenPayload {
  id: string;
  email: string;
  name: string;
}

export function signUserToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: USER_COOKIE_MAX_AGE });
}

export function verifyUserToken(token: string): UserTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    // Guard against an admin token being replayed here: a UserTokenPayload
    // always carries `email`, which admin tokens never do.
    if (!decoded || typeof decoded.email !== "string") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: NextRequest): UserTokenPayload | null {
  const token = request.cookies.get(USER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyUserToken(token);
}
