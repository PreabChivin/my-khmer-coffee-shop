import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import type { LuckyDrawDTO } from "@/lib/types";

function toDTO(d: {
  id: string;
  title: string;
  prizeName: string;
  prizeEmoji: string;
  month: string;
  minPoints: number;
  tierLabel: string | null;
  winnerName: string | null;
  drawnAt: Date | null;
  createdAt: Date;
}): LuckyDrawDTO {
  return {
    id: d.id,
    title: d.title,
    prizeName: d.prizeName,
    prizeEmoji: d.prizeEmoji,
    month: d.month,
    minPoints: d.minPoints,
    tierLabel: d.tierLabel,
    winnerName: d.winnerName,
    drawnAt: d.drawnAt ? d.drawnAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  prizeName: z.string().trim().min(1).max(120),
  prizeEmoji: z.string().trim().max(8).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "សូមប្រើទម្រង់ ឆ្នាំ-ខែ (YYYY-MM)។"),
  minPoints: z.number().int().min(0).max(1000000).optional(),
  tierLabel: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(40).optional()
  ),
});

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }
  try {
    const draws = await prisma.luckyDraw.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(draws.map(toDTO));
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
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានកម្មវិធីចាប់រង្វាន់មិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }
  try {
    const draw = await prisma.luckyDraw.create({
      data: {
        title: parsed.data.title,
        prizeName: parsed.data.prizeName,
        prizeEmoji: parsed.data.prizeEmoji || "🎁",
        month: parsed.data.month,
        minPoints: parsed.data.minPoints ?? 0,
        tierLabel: parsed.data.tierLabel ?? null,
      },
    });
    return NextResponse.json(toDTO(draw), { status: 201 });
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}
