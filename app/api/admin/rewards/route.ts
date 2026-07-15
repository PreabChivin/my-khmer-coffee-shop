import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const rewardSchema = z.object({
  name: z.string().trim().min(1).max(80),
  nameKh: z.string().trim().min(1).max(80),
  cost: z.number().int().positive().max(1000000),
  emoji: z.string().trim().max(8).optional(),
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(200).optional()
  ),
});

// 👑 Admin: full reward catalogue (incl. unavailable) + create a reward.
export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }
  try {
    const rewards = await prisma.reward.findMany({ orderBy: { cost: "asc" } });
    return NextResponse.json(rewards);
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const parsed = rewardSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានរង្វាន់មិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }
  try {
    const reward = await prisma.reward.create({
      data: {
        name: parsed.data.name,
        nameKh: parsed.data.nameKh,
        cost: parsed.data.cost,
        emoji: parsed.data.emoji || "🎁",
        description: parsed.data.description ?? null,
      },
    });
    return NextResponse.json(reward, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}
