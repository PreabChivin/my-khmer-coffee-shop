import { NextRequest } from "next/server";
import { getSessionFromRequest, type SessionPayload } from "@/lib/session";

// Back-compat alias — every existing app/api/admin/** and
// app/api/categories/** route imports this exact name/shape.
export type AdminTokenPayload = SessionPayload;

/** Staff or Admin — the same "can use the staff dashboard" check every
 *  existing admin API route already calls. */
export function getAdminFromRequest(
  request: NextRequest
): AdminTokenPayload | null {
  const session = getSessionFromRequest(request);
  if (!session) return null;
  return session.role === "STAFF" || session.role === "ADMIN" ? session : null;
}

/** Admin only — used by the User Management routes (role changes, password
 *  resets). STAFF cannot manage other accounts. */
export function requireAdminRole(
  request: NextRequest
): AdminTokenPayload | null {
  const session = getSessionFromRequest(request);
  if (!session) return null;
  return session.role === "ADMIN" ? session : null;
}
