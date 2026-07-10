import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { categoryCreateSchema } from "@/lib/validation/category";
import type { CategoryDTO } from "@/lib/types";

// 🍩 GET is intentionally public (no auth) — the homepage category slider
// fetches this directly from the browser. POST is staff-only.
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: true } } },
    });
    const body: CategoryDTO[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      iconKey: c.iconKey,
      iconUrl: c.iconUrl,
      productCount: c._count.products,
    }));
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = categoryCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid category" },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        iconKey: parsed.data.iconKey ?? null,
        iconUrl: parsed.data.iconUrl ?? null,
      },
    });
    const body: CategoryDTO = {
      id: category.id,
      name: category.name,
      iconKey: category.iconKey,
      iconUrl: category.iconUrl,
      productCount: 0,
    };
    return NextResponse.json(body, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
