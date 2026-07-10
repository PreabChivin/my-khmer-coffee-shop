import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { clampDiscountPercent } from "@/lib/pricing";

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

  if (
    body.price !== undefined &&
    (typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price <= 0)
  ) {
    return NextResponse.json(
      { error: "price must be a positive number" },
      { status: 400 }
    );
  }

  if (
    (body.nameEn !== undefined && !body.nameEn.trim()) ||
    (body.nameKh !== undefined && !body.nameKh.trim())
  ) {
    return NextResponse.json(
      { error: "nameEn and nameKh cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
        isPartner: body.isPartner ?? undefined,
        partnerName:
          "partnerName" in body ? body.partnerName?.trim() || null : undefined,
        discountPercent:
          "discountPercent" in body
            ? clampDiscountPercent(body.discountPercent)
            : undefined,
      },
    });
    return NextResponse.json(product);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
