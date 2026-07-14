import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/createOrder";
import { getUserFromRequest } from "@/lib/customerAuth";
import type { CheckoutRequestBody } from "@/lib/types";

export async function POST(request: NextRequest) {
  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const session = getUserFromRequest(request);
  const result = await createOrder(body, session);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.body, { status: 201 });
}
