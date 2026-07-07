import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

interface ProductPayload {
  nameEn?: string;
  nameKh?: string;
  descriptionEn?: string | null;
  descriptionKh?: string | null;
  price?: number;
  category?: string;
  image?: string;
  isAvailable?: boolean;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: ProductPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (body.price !== undefined && body.price <= 0) {
    return NextResponse.json(
      { error: "price must be greater than 0" },
      { status: 400 }
    );
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
      category: body.category?.trim() ?? undefined,
      image: body.image?.trim() ?? undefined,
      isAvailable: body.isAvailable ?? undefined,
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      {
        error:
          "This product has existing orders and cannot be deleted. Mark it unavailable instead.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
