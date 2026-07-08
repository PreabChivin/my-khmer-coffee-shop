import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 👯 Create a new Bestie Cart — anyone can start one, no auth needed.
export async function POST() {
  const groupCart = await prisma.groupCart.create({ data: {} });
  return NextResponse.json({ id: groupCart.id }, { status: 201 });
}
