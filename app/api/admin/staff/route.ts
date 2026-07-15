import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import type { AdminCustomerRowDTO } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createStaffSchema = z.object({
  name: z.string().trim().min(1, "តម្រូវឲ្យមានឈ្មោះពិត។").max(80),
  email: z
    .string()
    .trim()
    .min(3, "សូមបញ្ចូលអុីមែលឲ្យបានត្រឹមត្រូវ។")
    .max(200)
    .regex(EMAIL_RE, "សូមបញ្ចូលអុីមែលឲ្យបានត្រឹមត្រូវ។"),
  username: z.string().trim().min(1).max(40).optional(),
  password: z.string().min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ។").max(200),
  role: z.enum(["STAFF", "ADMIN"]),
});

// 👑 Admin-only: directly provision a new Staff/Admin account — this is
// provisioning by a trusted admin, not self-registration, so it skips the
// public registerSchema's dateOfBirth requirement entirely.
export async function POST(request: NextRequest) {
  if (!requireAdminRole(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }
  const { name, email, username, password, role } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        username: username || null,
        passwordHash,
        role,
      },
      include: { _count: { select: { orders: true } } },
    });

    const body: AdminCustomerRowDTO = {
      id: created.id,
      name: created.name,
      email: created.email,
      username: created.username,
      dateOfBirth: null,
      loyaltyPoints: created.loyaltyPoints,
      joinedAt: created.createdAt.toISOString(),
      orderCount: created._count.orders,
      role: created.role,
      deactivatedAt: null,
    };
    return NextResponse.json(body, { status: 201 });
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
