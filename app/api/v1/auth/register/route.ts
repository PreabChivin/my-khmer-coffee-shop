import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE_MAX_AGE, USER_COOKIE_NAME, signUserToken } from "@/lib/customerAuth";
import { registerSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/userDto";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * POST /api/v1/auth/register
 * Body: { email, password, name, dateOfBirth (YYYY-MM-DD), username?, phone? }
 * Success 201: { success: true, data: { user, token } }
 *
 * `token` is the same JWT the web app carries in a cookie — a mobile client
 * stores it (e.g. secure storage) and sends it back as
 * `Authorization: Bearer <token>` on every subsequent request. The cookie is
 * also set for parity; mobile clients simply ignore it.
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return withCors(apiError("ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។", 400));
  }

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return withCors(apiError(parsed.error.issues[0]?.message ?? "ព័ត៌មានមិនត្រឹមត្រូវទេ។", 400));
  }

  const email = parsed.data.email.toLowerCase();
  const { password, name, username, phone, dateOfBirth } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        username: username || null,
        phone: phone || null,
        dateOfBirth: new Date(`${dateOfBirth}T00:00:00Z`),
      },
    });

    const token = signUserToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    const response = withCors(apiSuccess({ user: toUserDTO(user), token }, 201));
    response.cookies.set(USER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_COOKIE_MAX_AGE,
    });
    return response;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "";
      const field = target.includes("username") ? "username" : "email";
      return withCors(apiError(`That ${field} is already registered.`, 409, "DUPLICATE"));
    }
    return withCors(apiError("ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។", 503));
  }
}
