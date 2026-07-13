import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { SavedAddressDTO } from "@/lib/types";

const MAX_SAVED_ADDRESSES = 10;

const createSchema = z.object({
  label: z.string().trim().min(1, "Give this address a name").max(40),
  address: z.string().trim().min(1, "Address is required").max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

function toDTO(row: {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}): SavedAddressDTO {
  return {
    id: row.id,
    label: row.label,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

// 📍 The logged-in customer's address book — scoped strictly to their own
// session's userId, same pattern as /api/orders/mine.
export async function GET(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const rows = await prisma.savedAddress.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows.map(toDTO));
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid address" },
      { status: 400 }
    );
  }

  try {
    const count = await prisma.savedAddress.count({ where: { userId: session.id } });
    if (count >= MAX_SAVED_ADDRESSES) {
      return NextResponse.json(
        { error: `You can save up to ${MAX_SAVED_ADDRESSES} addresses.` },
        { status: 400 }
      );
    }

    const created = await prisma.savedAddress.create({
      data: { userId: session.id, ...parsed.data },
    });
    return NextResponse.json(toDTO(created), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "The database is busy — please try again in a moment." },
      { status: 503 }
    );
  }
}
