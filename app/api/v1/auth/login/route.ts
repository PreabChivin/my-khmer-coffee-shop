import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { USER_COOKIE_MAX_AGE, USER_COOKIE_NAME, signUserToken } from "@/lib/customerAuth";
import { loginSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/userDto";
import { apiSuccess, apiError } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * POST /api/v1/auth/login
 * Body: { identifier (email or username), password }
 * Success 200: { success: true, data: { user, token } }
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return withCors(apiError("Invalid JSON body", 400));
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return withCors(apiError(parsed.error.issues[0]?.message ?? "Invalid credentials", 400));
  }

  const identifier = parsed.data.identifier.trim();
  const { password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { username: identifier }] },
  });

  // Constant-ish response: same error whether the account is missing or the
  // password is wrong, so we never reveal which emails are registered.
  const genericError = () => withCors(apiError("Invalid email/username or password.", 401));

  if (!user || !user.passwordHash) return genericError();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return genericError();

  if (user.deactivatedAt) {
    return withCors(
      apiError("This account has been deactivated. Contact an admin for help.", 403, "DEACTIVATED")
    );
  }

  const token = signUserToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  const response = withCors(apiSuccess({ user: toUserDTO(user), token }));
  response.cookies.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: USER_COOKIE_MAX_AGE,
  });
  return response;
}
