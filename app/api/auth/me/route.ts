import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toUserDTO } from "@/lib/userDto";

// Returns the freshly-read account for the current session cookie — always
// hits the DB so the loyalty-points balance is live (not stale from the JWT).
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  // 🚫 A still-valid JWT for an account deactivated after it was issued
  // (JWTs aren't re-checked per-request otherwise) — treat as signed out.
  if (!user || user.deactivatedAt) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: toUserDTO(user) });
}

const patchSchema = z.object({
  name: z.string({ error: "ឈ្មោះមិនអាចទទេបានទេ។" }).trim().min(1, "ឈ្មោះមិនអាចទទេបានទេ។").max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

/**
 * PATCH /api/auth/me
 * Body: { name?, phone? } — the account page's "Edit Profile" form. Same
 * fields/validation as PATCH /api/v1/auth/me (mobile API); this is the
 * web-facing counterpart, so it keeps this route's existing plain
 * { user } / { error } shape rather than the v1 { success, data } envelope.
 */
export async function PATCH(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  const { name, phone } = parsed.data;
  if (name === undefined && phone === undefined) {
    return NextResponse.json({ error: "គ្មានអ្វីត្រូវកែប្រែទេ។" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
      },
    });
    return NextResponse.json({ user: toUserDTO(user) });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
