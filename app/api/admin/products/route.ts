import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(products);
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
  } = body;

  if (
    !nameEn?.trim() ||
    !nameKh?.trim() ||
    typeof price !== "number" ||
    price <= 0 ||
    !category?.trim() ||
    !image?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "nameEn, nameKh, price, category, and image are required",
      },
      { status: 400 }
    );
  }

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
    },
  });

  return NextResponse.json(product, { status: 201 });
}
