import { USER_COOKIE_NAME } from "@/lib/customerAuth";
import { apiSuccess } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * POST /api/v1/auth/logout
 * Stateless JWT — there's nothing to revoke server-side. A mobile client
 * just discards its stored token; the cookie (unused by mobile) is cleared
 * for parity with the web app.
 */
export async function POST() {
  const response = withCors(apiSuccess({ message: "Logged out" }));
  response.cookies.set(USER_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
