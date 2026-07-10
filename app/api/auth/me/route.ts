import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { UserDTO } from "@/lib/types";

// Returns the freshly-read account for the current session cookie — always
// hits the DB so the loyalty-points balance is live (not stale from the JWT).
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const body: UserDTO = {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    phone: user.phone,
    loyaltyPoints: user.loyaltyPoints,
  };
  return NextResponse.json({ user: body });
}
