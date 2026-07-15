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
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.savedAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "រកមិនឃើញអាសយដ្ឋាននេះទេ។" }, { status: 404 });
    }

    await prisma.savedAddress.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
