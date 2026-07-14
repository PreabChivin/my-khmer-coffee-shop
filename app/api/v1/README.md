# Cafe Mobile API (`/api/v1`)

A versioned, mobile-facing REST API for the cafe web app's data — built for
a future React Native / Flutter client. It reuses the exact same business
logic as the web app (pricing, checkout, loyalty redemption) so behavior
never drifts between web and mobile.

## Base URL

```
https://<your-deployment>/api/v1
```

## Response envelope

Every response is JSON with a consistent shape:

**Success**
```json
{ "success": true, "data": { ... } }
```

**Error**
```json
{ "success": false, "error": { "message": "Human-readable message", "code": "OPTIONAL_CODE" } }
```

HTTP status codes are meaningful (`400` validation, `401` unauthenticated,
`403` forbidden/deactivated, `404` not found, `409` conflict, `503`
transient DB error) — always check `success` rather than relying on status
alone if your HTTP client swallows non-2xx bodies.

## Authentication

Register or log in to receive a JWT (`data.token`). Send it on every
authenticated request:

```
Authorization: Bearer <token>
```

The token is a 30-day-lived JWT — the same one the web app stores in an
`httpOnly` cookie. There is no refresh-token flow; when it expires, log in
again. Endpoints marked `auth: "optional"` below work either way — if a
valid token is present the request is linked to that account, otherwise it
proceeds anonymously (e.g. a guest checkout).

## CORS

All `/api/v1/*` routes send permissive CORS headers and respond to
`OPTIONS` preflight requests, so this API can also be called directly from
a browser-based tool.

## Endpoints

### Auth

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | — | `{ email, password, name, dateOfBirth (YYYY-MM-DD), username?, phone? }` | Returns `{ user, token }`, 201. |
| POST | `/auth/login` | — | `{ identifier (email or username), password }` | Returns `{ user, token }`. |
| POST | `/auth/logout` | — | — | Clears the cookie; stateless JWT — mobile clients just discard the token. |
| GET | `/auth/me` | required | — | Returns `{ user }`. |
| PATCH | `/auth/me` | required | `{ name?, phone? }` | Updates the caller's own profile. |

### Products & categories (public)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products` | — | Optional `?category=<categoryId>` filter. Returns `ProductDTO[]`. |
| GET | `/products/{id}` | — | Returns a single `ProductDTO`, 404 if missing. |
| GET | `/categories` | — | Returns `CategoryDTO[]` with `productCount`. |

### Orders

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/orders` | required | — | The caller's own order history (`OrderHistoryItemDTO[]`). |
| POST | `/orders` | optional | Same shape as the web checkout (`customerName`, `customerPhone`, `orderType`, `items[]`, `address?`, etc.) | If a valid Bearer token is sent, the order is linked to that account exactly like a web checkout. Returns `{ orderId, totalAmount, isGift }`, 201. |
| GET | `/orders/{id}` | required | — | Single order detail. Returns 404 (not 403) for orders that exist but belong to another account. |

### Loyalty

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/loyalty/points` | required | Returns `{ points, tier, nextTier, percentToNextTier, pointsToNextTier }`, tier math computed server-side. |
| GET | `/loyalty/rewards` | — | Public reward catalog, cheapest first. |
| POST | `/loyalty/rewards/{id}/redeem` | required | Atomically deducts points and creates a redemption. Returns `{ user, redemption }`. |
| GET | `/loyalty/redemptions` | required | The caller's own redemption history. |

## Polling for "real-time" updates

There is no push/WebSocket channel. Mirror the web app's own pattern:
poll `GET /orders/{id}` (or `GET /orders`) every few seconds while an
order is active, the same way the in-browser order tracker does.
