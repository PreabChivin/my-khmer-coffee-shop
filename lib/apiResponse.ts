import { NextResponse } from "next/server";

// 📱 Consistent JSON envelope for the /api/v1/* mobile-facing surface only —
// existing web-facing routes keep their current ad-hoc shapes (raw arrays,
// raw DTOs, plain {error}) since the web app's own fetch call sites already
// parse those exact shapes; retrofitting them would be pure risk for zero
// benefit to the web app. New v1 routes get one predictable contract instead.

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessBody<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ success: false, error: { message, code } }, { status });
}
