import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/customerAuth";
import { purchaseShopItem } from "@/lib/shopPurchase";

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { itemId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  if (!body.itemId || typeof body.itemId !== "string") {
    return NextResponse.json({ error: "តម្រូវឲ្យមានលេខវត្ថុ។" }, { status: 400 });
  }

  const result = await purchaseShopItem(session.id, body.itemId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.body);
}
