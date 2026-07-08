import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailableFreeDrinks, normalizePhone } from "@/lib/loyalty";
import type { LoyaltyStatusResponseBody } from "@/lib/types";

// Public, read-only lookup by phone number — no PII beyond a stamp count is
// exposed, so no admin auth is required (matches the app's no-login model).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;
  const normalized = normalizePhone(phone);

  if (normalized.length < 6) {
    return NextResponse.json(
      { error: "A valid phone number is required" },
      { status: 400 }
    );
  }

  const account = await prisma.loyaltyAccount.findUnique({
    where: { phone: normalized },
  });

  const stampCount = account?.stampCount ?? 0;
  const freeDrinksRedeemed = account?.freeDrinksRedeemed ?? 0;

  const body: LoyaltyStatusResponseBody = {
    phone: normalized,
    stampCount,
    stampsTowardNext: stampCount % 6,
    availableFreeDrinks: computeAvailableFreeDrinks(
      stampCount,
      freeDrinksRedeemed
    ),
  };

  return NextResponse.json(body);
}
