import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { clampDiscountPercent, clampFlatDiscount } from "@/lib/pricing";
import type { ProductDTO } from "@/lib/types";

function toProductDTO(
  product: Prisma.ProductGetPayload<{ include: { category: true } }>
): ProductDTO {
  const { category, ...rest } = product;
  return { ...rest, category: category.name };
}

interface ProductPayload {
  nameEn?: string;
  nameKh?: string;
  descriptionEn?: string | null;
  descriptionKh?: string | null;
  price?: number;
  categoryId?: string;
  image?: string;
  isAvailable?: boolean;
  isPartner?: boolean;
  partnerName?: string | null;
  discountPercent?: number;
  flatDiscount?: number;
  promoTag?: string | null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  const { id } = await params;

  let body: ProductPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  if (
    body.price !== undefined &&
    (typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price <= 0)
  ) {
    return NextResponse.json(
      { error: "តម្លៃត្រូវតែជាចំនួនវិជ្ជមាន។" },
      { status: 400 }
    );
  }

  if (
    (body.nameEn !== undefined && !body.nameEn.trim()) ||
    (body.nameKh !== undefined && !body.nameKh.trim())
  ) {
    return NextResponse.json(
      { error: "ឈ្មោះជាភាសាអង់គ្លេស និងខ្មែរ មិនអាចទទេបានទេ។" },
      { status: 400 }
    );
  }

  if (body.categoryId !== undefined && !body.categoryId.trim()) {
    return NextResponse.json(
      { error: "ត្រូវជ្រើសរើសប្រភេទ។" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញផលិតផលនេះទេ។" }, { status: 404 });
    }

    if (body.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!category) {
        return NextResponse.json({ error: "រកមិនឃើញប្រភេទនេះទេ។" }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        nameEn: body.nameEn?.trim() ?? undefined,
        nameKh: body.nameKh?.trim() ?? undefined,
        descriptionEn:
          "descriptionEn" in body ? body.descriptionEn?.trim() || null : undefined,
        descriptionKh:
          "descriptionKh" in body ? body.descriptionKh?.trim() || null : undefined,
        price: body.price ?? undefined,
        categoryId: body.categoryId?.trim() ?? undefined,
        image: body.image?.trim() ?? undefined,
        isAvailable: body.isAvailable ?? undefined,
        isPartner: body.isPartner ?? undefined,
        partnerName:
          "partnerName" in body ? body.partnerName?.trim() || null : undefined,
        discountPercent:
          "discountPercent" in body
            ? clampDiscountPercent(body.discountPercent)
            : undefined,
        flatDiscount:
          "flatDiscount" in body
            ? clampFlatDiscount(body.flatDiscount)
            : undefined,
        promoTag:
          "promoTag" in body ? body.promoTag?.trim() || null : undefined,
      },
      include: { category: true },
    });
    return NextResponse.json(toProductDTO(product));
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "មានផលិតផលឈ្មោះនេះជាភាសាអង់គ្លេសរួចហើយ។" },
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
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "រកមិនឃើញផលិតផលនេះទេ។" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "This product has existing orders and cannot be deleted. Mark it unavailable instead.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
