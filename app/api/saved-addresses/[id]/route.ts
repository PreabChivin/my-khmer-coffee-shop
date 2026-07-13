import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";

// 📍 Remove one saved address — ownership-checked so a customer can only
// ever delete their own (same pattern as the admin role/password routes:
// verify existing.userId === session.id before mutating).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.savedAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.savedAddress.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
