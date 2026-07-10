import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { clampDiscountPercent } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
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
  category?: string;
  image?: string;
  isAvailable?: boolean;
  isPartner?: boolean;
  partnerName?: string | null;
  discountPercent?: number;
}

export async function POST(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProductPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    nameEn,
    nameKh,
    descriptionEn,
    descriptionKh,
    price,
    category,
    image,
    isAvailable,
    isPartner,
    partnerName,
    discountPercent,
  } = body;

  if (
    !nameEn?.trim() ||
    !nameKh?.trim() ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !category?.trim() ||
    !image?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "nameEn, nameKh, a positive price, category, and image are required",
      },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        nameEn: nameEn.trim(),
        nameKh: nameKh.trim(),
        descriptionEn: descriptionEn?.trim() || null,
        descriptionKh: descriptionKh?.trim() || null,
        price,
        category: category.trim(),
        image: image.trim(),
        isAvailable: isAvailable ?? true,
        isPartner: isPartner ?? false,
        partnerName: isPartner ? partnerName?.trim() || null : null,
        discountPercent: clampDiscountPercent(discountPercent),
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A product with this English name already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
