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
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  if (session.id === id) {
    return NextResponse.json(
      { error: "You can't change your own role — ask another admin." },
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid role" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
    });
    return NextResponse.json({ id: user.id, role: user.role });
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
