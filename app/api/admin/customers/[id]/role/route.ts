import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

const schema = z.object({
  role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]),
});

// 👑 Admin-only: change any account's role. An admin cannot change their own
// role through this panel (must be done by a different admin) — a simple,
// unconditional guard against accidental self-lockout.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireAdminRole(request);
  if (!session) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }
  const { id } = await params;

  if (session.id === id) {
    return NextResponse.json(
      { error: "អ្នកមិនអាចប្តូរតួនាទីខ្លួនឯងបានទេ — សូមសុំឲ្យអ្នកគ្រប់គ្រងផ្សេងធ្វើឲ្យ។" },
      { status: 400 }
    );
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
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានតួនាទីមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញគណនីនេះទេ។" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
    });
    return NextResponse.json({ id: user.id, role: user.role });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
