import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toUserDTO } from "@/lib/userDto";

// Returns the freshly-read account for the current session cookie — always
// hits the DB so the loyalty-points balance is live (not stale from the JWT).
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  // 🚫 A still-valid JWT for an account deactivated after it was issued
  // (JWTs aren't re-checked per-request otherwise) — treat as signed out.
  if (!user || user.deactivatedAt) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: toUserDTO(user) });
}
