import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 👯 Update a shared Bestie Cart item's quantity — open to anyone with the link.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  let body: { quantity?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }

  if (
    typeof body.quantity !== "number" ||
    !Number.isInteger(body.quantity) ||
    body.quantity <= 0
  ) {
    return NextResponse.json(
      { error: "ចំនួនត្រូវតែជាចំនួនគត់វិជ្ជមាន។" },
      { status: 400 }
    );
  }

  const item = await prisma.groupCartItem.findUnique({ where: { id: itemId } });
  if (!item || item.groupCartId !== id) {
    return NextResponse.json({ error: "រកមិនឃើញទំនិញនេះទេ។" }, { status: 404 });
  }

  await prisma.groupCartItem.update({
    where: { id: itemId },
    data: { quantity: body.quantity },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;

  const item = await prisma.groupCartItem.findUnique({ where: { id: itemId } });
  if (!item || item.groupCartId !== id) {
    return NextResponse.json({ error: "រកមិនឃើញទំនិញនេះទេ។" }, { status: 404 });
  }

  await prisma.groupCartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
