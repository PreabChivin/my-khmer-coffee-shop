import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { toUserDTO } from "@/lib/userDto";
import type { CustomerProfileDTO } from "@/lib/types";

// 👑 Admin-only per-customer profile: account details + lifetime arcade
// scoreboard (wins/losses/ties from GameSession play).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "រកមិនឃើញអតិថិជននេះទេ។" }, { status: 404 });
    }

    const body: CustomerProfileDTO = {
      user: toUserDTO(user),
      gameWins: user.gameWins,
      gameLosses: user.gameLosses,
      gameTies: user.gameTies,
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
