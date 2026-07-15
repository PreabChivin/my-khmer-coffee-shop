import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  emoji: z.string().trim().max(8).optional(),
  href: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(300).optional()
  ),
  // Omit/null => broadcast to ALL customers; set => private to one user.
  userId: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().optional()
  ),
});

// 👑 Targeted Notification Engine — broadcast to all customers or DM one.
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
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានការជូនដំណឹងមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  try {
    // If targeting a specific user, make sure they exist.
    if (parsed.data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "រកមិនឃើញអតិថិជនគោលដៅនេះទេ។" }, { status: 400 });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId: parsed.data.userId ?? null,
        title: parsed.data.title,
        body: parsed.data.body,
        href: parsed.data.href ?? null,
        emoji: parsed.data.emoji || "📣",
      },
    });
    return NextResponse.json(
      { success: true, id: notification.id, broadcast: !parsed.data.userId },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀត។" }, { status: 503 });
  }
}
