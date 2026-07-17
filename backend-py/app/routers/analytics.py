"""GET /api/v1/analytics/predict — sales-trend analytics over recent PAID orders.

Mirrors the definition used by the existing Next.js route
(`app/api/admin/analytics/predict/route.ts`): a 7-day moving-average trend, NOT
a trained forecasting model. Same revenue rule (payment.paymentStatus = 'PAID')
so the Python and TypeScript numbers stay comparable. When the DB is
unreachable the endpoint returns an honest ``db_unavailable`` payload instead
of failing, so the pipeline is verifiable without live creds.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.db import db_available, get_pool
from app.models import DailyTotal, SalesPrediction
from app.security import require_api_key

router = APIRouter(prefix="/analytics", tags=["analytics"])

LOOKBACK_DAYS = 7

# Prisma maps model "Order" → table "Order", "Payment" → "Payment" (quoted,
# case-sensitive). This reads the same shape the TS route computes in Prisma.
_QUERY = """
    SELECT o."createdAt" AS created_at, o."totalAmount" AS total_amount
    FROM "Order" o
    JOIN "Payment" p ON p."orderId" = o.id
    WHERE p."paymentStatus" = 'PAID'
      AND o."createdAt" >= $1
"""


@router.get("/predict", response_model=SalesPrediction, dependencies=[Depends(require_api_key)])
async def predict() -> SalesPrediction:
    since = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(
        days=LOOKBACK_DAYS - 1
    )

    if not db_available():
        return SalesPrediction(source="db_unavailable", lookback_days=LOOKBACK_DAYS)

    pool = get_pool()
    assert pool is not None
    async with pool.acquire() as conn:
        rows = await conn.fetch(_QUERY, since)

    # Seed every day in the window with 0 so gaps show as zero, not missing.
    totals: dict[str, float] = {}
    for i in range(LOOKBACK_DAYS):
        day = (since + timedelta(days=i)).date()
        totals[day.isoformat()] = 0.0
    for row in rows:
        created: datetime = row["created_at"]
        key = created.date().isoformat()
        if key in totals:
            totals[key] += float(row["total_amount"])

    recent = [DailyTotal(date=d, total=round(t, 2)) for d, t in sorted(totals.items())]
    values = [d.total for d in recent]
    avg = round(sum(values) / len(values), 2) if values else 0.0

    mid = len(values) // 2
    first_half = values[:mid]
    second_half = values[mid:]
    first_avg = sum(first_half) / len(first_half) if first_half else 0.0
    second_avg = sum(second_half) / len(second_half) if second_half else 0.0

    trend = "flat"
    trend_pct = 0.0
    if first_avg > 0:
        trend_pct = round(((second_avg - first_avg) / first_avg) * 100, 1)
        if trend_pct > 5:
            trend = "up"
        elif trend_pct < -5:
            trend = "down"
    elif second_avg > 0:
        trend, trend_pct = "up", 100.0

    return SalesPrediction(
        source="python-analytics",
        recent_daily=recent,
        average_daily_total=avg,
        projected_next_week_total=round(avg * 7, 2),
        trend=trend,
        trend_percent=trend_pct,
        lookback_days=LOOKBACK_DAYS,
    )
