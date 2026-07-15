import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";

/**
 * POST /api/chat/games/[id]/cancel
 * The challenger withdraws their own still-open challenge. Guarded updateMany
 * so it only affects a PENDING game owned by the caller — you can't cancel a
 * match that's already been accepted and is live.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const cancelled = await prisma.gameSession.updateMany({
      where: { id, player1Id: session.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (cancelled.count === 0) {
      return NextResponse.json(
        { error: "មិនអាចបោះបង់ការលេងនេះបានទេ។" },
        { status: 409 }
      );
    }
    return NextResponse.json({ status: "CANCELLED" });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" },
      { status: 503 }
    );
  }
}
