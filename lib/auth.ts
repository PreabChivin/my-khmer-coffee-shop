import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
export const ADMIN_COOKIE_NAME = "admin_token";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export interface AdminTokenPayload {
  id: string;
  username: string;
  name: string;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ADMIN_COOKIE_MAX_AGE });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(
  request: NextRequest
): AdminTokenPayload | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
