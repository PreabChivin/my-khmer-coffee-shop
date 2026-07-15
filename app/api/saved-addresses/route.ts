import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { SavedAddressDTO } from "@/lib/types";

const MAX_SAVED_ADDRESSES = 10;

const createSchema = z.object({
  label: z
    .string({ error: "សូមដាក់ឈ្មោះអាសយដ្ឋាននេះ។" })
    .trim()
    .min(1, "សូមដាក់ឈ្មោះអាសយដ្ឋាននេះ។")
    .max(40),
  address: z
    .string({ error: "តម្រូវឲ្យមានអាសយដ្ឋាន។" })
    .trim()
    .min(1, "តម្រូវឲ្យមានអាសយដ្ឋាន។")
    .max(300),
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
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  try {
    const rows = await prisma.savedAddress.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows.map(toDTO));
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ព័ត៌មានអាសយដ្ឋានមិនត្រឹមត្រូវទេ។" },
      { status: 400 }
    );
  }

  try {
    const count = await prisma.savedAddress.count({ where: { userId: session.id } });
    if (count >= MAX_SAVED_ADDRESSES) {
      return NextResponse.json(
        { error: `អាចរក្សាទុកអាសយដ្ឋានបានតែ ${MAX_SAVED_ADDRESSES} ប៉ុណ្ណោះ។` },
        { status: 400 }
      );
    }

    const created = await prisma.savedAddress.create({
      data: { userId: session.id, ...parsed.data },
    });
    return NextResponse.json(toDTO(created), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "ប្រព័ន្ធកំពុងមមាញឹកបន្តិច សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិចទៀតនេះ។" },
      { status: 503 }
    );
  }
}
