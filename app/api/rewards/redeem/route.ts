import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/customerAuth";
import { redeemReward } from "@/lib/redeemReward";

export async function POST(request: NextRequest) {
  const session = getUserFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "សូមចូលគណនីជាមុនសិន។" }, { status: 401 });
  }

  let body: { rewardId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ទិន្នន័យដែលបានផ្ញើមកមិនត្រឹមត្រូវទេ។" }, { status: 400 });
  }
  if (!body.rewardId || typeof body.rewardId !== "string") {
    return NextResponse.json({ error: "តម្រូវឲ្យមានលេខរង្វាន់។" }, { status: 400 });
  }

  const result = await redeemReward(session.id, body.rewardId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.body);
}
