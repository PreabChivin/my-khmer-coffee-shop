import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { categoryUpdateSchema } from "@/lib/validation/category";
import type { CategoryDTO } from "@/lib/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const parsed = categoryUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានប្រភេទមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញប្រភេទនេះទេ។" }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name ?? undefined,
        iconKey: "iconKey" in parsed.data ? parsed.data.iconKey ?? null : undefined,
        iconUrl: "iconUrl" in parsed.data ? parsed.data.iconUrl ?? null : undefined,
      },
    });

    const body: CategoryDTO = {
      id: category.id,
      name: category.name,
      iconKey: category.iconKey,
      iconUrl: category.iconUrl,
      productCount: existing._count.products,
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "មានប្រភេទឈ្មោះនេះរួចហើយ។" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញប្រភេទនេះទេ។" }, { status: 404 });
    }

    // ⚠️ onDelete: Cascade on Product.categoryId — this deletes every
    // product in the category too. The Category Manager must confirm this
    // with the product count (already surfaced via GET) before calling DELETE.
    await prisma.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      deletedProductCount: existing._count.products,
    });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
