import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

// 👑 Admin-only: soft-delete — blocks login without erasing any data.
// Reversible via the sibling /reactivate route. An admin can never
// deactivate themselves, and the last remaining active ADMIN can never be
// deactivated by anyone (would lock every admin out of the dashboard).
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
      { error: "អ្នកមិនអាចផ្អាកគណនីខ្លួនឯងបានទេ — សូមសុំឲ្យអ្នកគ្រប់គ្រងផ្សេងធ្វើឲ្យ។" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញគណនីនេះទេ។" }, { status: 404 });
    }
    if (existing.deactivatedAt) {
      return NextResponse.json({ id: existing.id, deactivatedAt: existing.deactivatedAt });
    }

    if (existing.role === "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", deactivatedAt: null },
      });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: "មិនអាចផ្អាកអ្នកគ្រប់គ្រងសកម្មចុងក្រោយបានទេ។" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { deactivatedAt: new Date() },
    });
    return NextResponse.json({ id: updated.id, deactivatedAt: updated.deactivatedAt });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
