import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  USER_COOKIE_MAX_AGE,
  USER_COOKIE_NAME,
  signUserToken,
} from "@/lib/customerAuth";
import { loginSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/userDto";

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid credentials" },
      { status: 400 }
    );
  }

  const identifier = parsed.data.identifier.trim();
  const { password } = parsed.data;

  // The identifier may be an email or a username.
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
    },
  });

  // Constant-ish response: same error whether the account is missing or the
  // password is wrong, so we never reveal which emails are registered.
  const genericError = NextResponse.json(
    { error: "Invalid email/username or password." },
    { status: 401 }
  );

  if (!user || !user.passwordHash) return genericError;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return genericError;

  const body = toUserDTO(user);
  const response = NextResponse.json(body);
  response.cookies.set(
    USER_COOKIE_NAME,
    signUserToken({ id: user.id, email: user.email, name: user.name }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_COOKIE_MAX_AGE,
    }
  );
  return response;
}
