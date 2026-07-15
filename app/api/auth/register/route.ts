import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  USER_COOKIE_MAX_AGE,
  USER_COOKIE_NAME,
  signUserToken,
} from "@/lib/customerAuth";
import { registerSchema } from "@/lib/validation/auth";
import { toUserDTO } from "@/lib/userDto";

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
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

    const body = toUserDTO(user);
    const response = NextResponse.json(body, { status: 201 });
    response.cookies.set(
      USER_COOKIE_NAME,
      signUserToken({ id: user.id, email: user.email, name: user.name, role: user.role }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: USER_COOKIE_MAX_AGE,
      }
    );
    return response;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "";
      const field = target.includes("username") ? "username" : "email";
      const fieldLabel = field === "username" ? "ឈ្មោះអ្នកប្រើ" : "អុីមែល";
      return NextResponse.json(
        { error: `${fieldLabel}នេះត្រូវបានប្រើរួចហើយ។` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
