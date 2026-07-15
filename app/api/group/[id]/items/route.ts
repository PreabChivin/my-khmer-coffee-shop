import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeCustomization } from "@/lib/customization";

interface AddItemBody {
  contributorName?: string;
  productId?: string;
  quantity?: number;
  customization?: unknown;
}

// 👯 Add a drink to a shared Bestie Cart — open to anyone with the link.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: AddItemBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  const contributorName = body.contributorName?.trim().slice(0, 60);
  if (!contributorName) {
    return NextResponse.json(
      { error: "តម្រូវឲ្យមានឈ្មោះអ្នកបញ្ជាទិញ។" },
      { status: 400 }
    );
  }

  if (
    typeof body.productId !== "string" ||
    typeof body.quantity !== "number" ||
    !Number.isInteger(body.quantity) ||
    body.quantity <= 0
  ) {
    return NextResponse.json(
      { error: "តម្រូវឲ្យមានលេខផលិតផល និងចំនួនត្រឹមត្រូវ។" },
      { status: 400 }
    );
  }

  const groupCart = await prisma.groupCart.findUnique({ where: { id } });
  if (!groupCart) {
    return NextResponse.json({ error: "រកមិនឃើញកន្ត្រកមិត្តភ័ក្តិនេះទេ។" }, { status: 404 });
  }
  if (groupCart.status !== "OPEN") {
    return NextResponse.json(
      { error: "កន្ត្រកមិត្តភ័ក្តិនេះបានទូទាត់រួចហើយ។" },
      { status: 409 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: body.productId },
    include: { category: true },
  });
  if (!product) {
    return NextResponse.json({ error: "រកមិនឃើញផលិតផលនេះទេ។" }, { status: 400 });
  }
  if (!product.isAvailable) {
    return NextResponse.json(
      { error: `${product.nameEn} is currently out of stock` },
      { status: 400 }
    );
  }

  const customization = sanitizeCustomization(product.category.name, body.customization);

  const item = await prisma.groupCartItem.create({
    data: {
      groupCartId: id,
      contributorName,
      productId: product.id,
      quantity: body.quantity,
      customizations:
        customization === null
          ? Prisma.DbNull
          : (customization as unknown as Prisma.InputJsonValue),
    },
  });

  return NextResponse.json({ id: item.id }, { status: 201 });
}
