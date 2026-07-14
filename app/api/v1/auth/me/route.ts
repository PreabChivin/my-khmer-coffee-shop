import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import { toUserDTO } from "@/lib/userDto";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

const patchSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile. Accepts either a Bearer token
 * or the web session cookie (lib/session.ts checks both).
 */
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("Please sign in first.", 401));
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.deactivatedAt) {
    return withCors(apiError("Account not found.", 404));
  }

  return withCors(apiSuccess({ user: toUserDTO(user) }));
}

/**
 * PATCH /api/v1/auth/me
 * Body: { name?, phone? } — updates the caller's own profile fields.
 */
export async function PATCH(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return withCors(apiError("Please sign in first.", 401));
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return withCors(apiError("Invalid JSON body", 400));
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return withCors(apiError(parsed.error.issues[0]?.message ?? "Invalid details", 400));
  }

  const { name, phone } = parsed.data;
  if (name === undefined && phone === undefined) {
    return withCors(apiError("Nothing to update.", 400));
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
    },
  });

  return withCors(apiSuccess({ user: toUserDTO(user) }));
}
