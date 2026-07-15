import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { RewardDTO } from "@/lib/types";

// 🎁 Public list of redeemable rewards (loyalty store), cheapest first.
export async function GET() {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isAvailable: true },
      orderBy: { cost: "asc" },
    });
    const body: RewardDTO[] = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      nameKh: r.nameKh,
      cost: r.cost,
      emoji: r.emoji,
      description: r.description,
      isAvailable: r.isAvailable,
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
