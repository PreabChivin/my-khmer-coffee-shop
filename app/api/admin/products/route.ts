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

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { createdAt: "asc" }],
    });
    return NextResponse.json(products.map(toProductDTO));
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
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

export async function POST(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "អ្នកមិនមានសិទ្ធិចូលប្រើមុខងារនេះទេ។" }, { status: 401 });
  }

  let body: ProductPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const {
    nameEn,
    nameKh,
    descriptionEn,
    descriptionKh,
    price,
    categoryId,
    image,
    isAvailable,
    isPartner,
    partnerName,
    discountPercent,
    flatDiscount,
    promoTag,
  } = body;

  if (
    !nameEn?.trim() ||
    !nameKh?.trim() ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !categoryId?.trim() ||
    !image?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "nameEn, nameKh, a positive price, categoryId, and image are required",
      },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "រកមិនឃើញប្រភេទនេះទេ។" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        nameEn: nameEn.trim(),
        nameKh: nameKh.trim(),
        descriptionEn: descriptionEn?.trim() || null,
        descriptionKh: descriptionKh?.trim() || null,
        price,
        categoryId,
        image: image.trim(),
        isAvailable: isAvailable ?? true,
        isPartner: isPartner ?? false,
        partnerName: isPartner ? partnerName?.trim() || null : null,
        discountPercent: clampDiscountPercent(discountPercent),
        flatDiscount: clampFlatDiscount(flatDiscount),
        promoTag: promoTag?.trim() || null,
      },
      include: { category: true },
    });
    return NextResponse.json(toProductDTO(product), { status: 201 });
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
