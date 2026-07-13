import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

const schema = z.object({
  // Must match the target account's email exactly — a deliberate extra step
  // beyond a plain confirm dialog, since this is the one truly irreversible
  // action in the whole User Management suite.
  confirmText: z.string().trim().min(1),
});

// 👑 Admin-only: permanent DELETE. Relies entirely on the schema's existing
// cascade rules — RedemptionHistory and SavedAddress (onDelete: Cascade) are
// erased with the account; Order.userId (onDelete: SetNull) already
// preserves order/receipt history by design, unlinked from the deleted
// account. No new cascade logic needed here. Same self/last-admin guards as
// /deactivate.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireAdminRole(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  if (session.id === id) {
    return NextResponse.json(
      { error: "You can't delete your own account — ask another admin." },
      { status: 400 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Type the account's email to confirm." }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (parsed.data.confirmText.trim().toLowerCase() !== existing.email.toLowerCase()) {
      return NextResponse.json(
        { error: "That doesn't match the account's email — nothing was deleted." },
        { status: 400 }
      );
    }

    if (existing.role === "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", deactivatedAt: null },
      });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: "Can't delete the last active admin." },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
