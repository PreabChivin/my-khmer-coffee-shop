import { apiSuccess } from "@/lib/apiResponse";
import { withCors, corsPreflight } from "@/lib/apiCors";

export const OPTIONS = corsPreflight;

/**
 * GET /api/v1
 * Discoverability index for the mobile-facing API surface. See
 * app/api/v1/README.md for full request/response contracts.
 */
export async function GET() {
  return withCors(
    apiSuccess({
      name: "Cafe Mobile API",
      version: "v1",
      docs: "/api/v1/README.md (in the repo)",
      endpoints: [
        { method: "POST", path: "/api/v1/auth/register", auth: false },
        { method: "POST", path: "/api/v1/auth/login", auth: false },
        { method: "POST", path: "/api/v1/auth/logout", auth: true },
        { method: "GET", path: "/api/v1/auth/me", auth: true },
        { method: "PATCH", path: "/api/v1/auth/me", auth: true },
        { method: "GET", path: "/api/v1/products", auth: false },
        { method: "GET", path: "/api/v1/products/{id}", auth: false },
        { method: "GET", path: "/api/v1/categories", auth: false },
        { method: "GET", path: "/api/v1/orders", auth: true },
        { method: "POST", path: "/api/v1/orders", auth: "optional" },
        { method: "GET", path: "/api/v1/orders/{id}", auth: true },
        { method: "GET", path: "/api/v1/loyalty/points", auth: true },
        { method: "GET", path: "/api/v1/loyalty/rewards", auth: false },
        { method: "POST", path: "/api/v1/loyalty/rewards/{id}/redeem", auth: true },
        { method: "GET", path: "/api/v1/loyalty/redemptions", auth: true },
      ],
    })
  );
}
