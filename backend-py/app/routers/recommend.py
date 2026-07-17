"""POST /api/v1/ai/recommend — order-history-based coffee suggestions.

Mirrors the heuristic of the existing Next.js route
(`app/api/recommendations/route.ts`): a 3-tier read of a member's own order
history — their most-ordered item ("your usual") → best-rated items in their
favourite category → site-wide recent best-sellers as a cold-start fallback.
NOT a trained recommender; this is the honest slot where one would later go.
Returns ``db_unavailable`` (empty list) when Postgres is unreachable.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.db import db_available, get_pool
from app.models import Recommendation, RecommendRequest, RecommendResponse
from app.security import require_api_key

router = APIRouter(prefix="/ai", tags=["ai"])

POPULAR_LOOKBACK_DAYS = 30

_USUAL_QUERY = """
    SELECT oi."productId" AS product_id, SUM(oi.quantity) AS qty
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."userId" = $1 AND o."orderStatus" <> 'CANCELLED'
    GROUP BY oi."productId"
    ORDER BY qty DESC
"""

_PRODUCT_QUERY = """
    SELECT p.id, p."nameEn" AS name, p."categoryId" AS category_id, p."isAvailable" AS is_available
    FROM "Product" p
    WHERE p.id = ANY($1::text[])
"""

_CATEGORY_PICKS_QUERY = """
    SELECT p.id, p."nameEn" AS name
    FROM "Product" p
    WHERE p."categoryId" = $1 AND p."isAvailable" = true
      AND NOT (p.id = ANY($2::text[]))
    ORDER BY p."ratingSum" DESC
    LIMIT $3
"""

_POPULAR_QUERY = """
    SELECT oi."productId" AS product_id, SUM(oi.quantity) AS qty
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."createdAt" >= $1 AND o."orderStatus" <> 'CANCELLED'
      AND NOT (oi."productId" = ANY($2::text[]))
    GROUP BY oi."productId"
    ORDER BY qty DESC
    LIMIT $3
"""


@router.post("/recommend", response_model=RecommendResponse, dependencies=[Depends(require_api_key)])
async def recommend(payload: RecommendRequest) -> RecommendResponse:
    if not db_available():
        return RecommendResponse(source="db_unavailable", user_id=payload.user_id)

    pool = get_pool()
    assert pool is not None
    recs: list[Recommendation] = []
    exclude: list[str] = []

    async with pool.acquire() as conn:
        history = await conn.fetch(_USUAL_QUERY, payload.user_id)

        if history:
            ordered_ids = [r["product_id"] for r in history]
            products = await conn.fetch(_PRODUCT_QUERY, ordered_ids)
            by_id = {p["id"]: p for p in products}

            # 1. "Your usual" — most-ordered still-available product.
            for r in history:
                p = by_id.get(r["product_id"])
                if p and p["is_available"]:
                    recs.append(
                        Recommendation(
                            product_id=p["id"],
                            name=p["name"],
                            reason="your-usual",
                            score=float(r["qty"]),
                        )
                    )
                    exclude.append(p["id"])
                    break

            # 2. Best-rated items in their most-ordered category.
            qty_by_cat: dict[str, float] = {}
            for r in history:
                p = by_id.get(r["product_id"])
                if p:
                    qty_by_cat[p["category_id"]] = qty_by_cat.get(p["category_id"], 0.0) + float(r["qty"])
            if qty_by_cat and len(recs) < payload.limit:
                top_cat = max(qty_by_cat, key=qty_by_cat.get)
                exclude_for_cat = exclude + ordered_ids
                picks = await conn.fetch(
                    _CATEGORY_PICKS_QUERY, top_cat, exclude_for_cat, payload.limit - len(recs)
                )
                for p in picks:
                    recs.append(
                        Recommendation(
                            product_id=p["id"], name=p["name"], reason="popular-in-category", score=0.0
                        )
                    )
                    exclude.append(p["id"])

        # 3. Cold-start / fill — recent site-wide best-sellers.
        if len(recs) < payload.limit:
            since = datetime.now(timezone.utc) - timedelta(days=POPULAR_LOOKBACK_DAYS)
            popular = await conn.fetch(_POPULAR_QUERY, since, exclude, payload.limit - len(recs))
            if popular:
                pop_ids = [r["product_id"] for r in popular]
                pop_products = {p["id"]: p for p in await conn.fetch(_PRODUCT_QUERY, pop_ids)}
                for r in popular:
                    if len(recs) >= payload.limit:
                        break
                    p = pop_products.get(r["product_id"])
                    if p and p["is_available"]:
                        recs.append(
                            Recommendation(
                                product_id=p["id"],
                                name=p["name"],
                                reason="popular-overall",
                                score=float(r["qty"]),
                            )
                        )

    return RecommendResponse(source="python-ai", user_id=payload.user_id, recommendations=recs)
