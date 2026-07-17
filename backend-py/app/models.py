"""Pydantic request/response schemas — the typed contract the Next.js bridge
codes against. Field names mirror the existing TypeScript DTOs where they
overlap, so the two implementations stay wire-compatible.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


# ── Analytics ────────────────────────────────────────────────────────────────
class DailyTotal(BaseModel):
    date: str
    total: float


class SalesPrediction(BaseModel):
    source: Literal["python-analytics", "db_unavailable"]
    recent_daily: list[DailyTotal] = Field(default_factory=list)
    average_daily_total: float = 0.0
    projected_next_week_total: float = 0.0
    trend: Literal["up", "down", "flat"] = "flat"
    trend_percent: float = 0.0
    lookback_days: int = 7


# ── Recommendations ──────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    user_id: str = Field(min_length=1)
    limit: int = Field(default=3, ge=1, le=10)


class Recommendation(BaseModel):
    product_id: str
    name: str
    reason: Literal["your-usual", "popular-in-category", "popular-overall"]
    score: float


class RecommendResponse(BaseModel):
    source: Literal["python-ai", "db_unavailable"]
    user_id: str
    recommendations: list[Recommendation] = Field(default_factory=list)


# ── Moderation ───────────────────────────────────────────────────────────────
class ModerateRequest(BaseModel):
    text: str = Field(default="", max_length=4000)


class ModerateResponse(BaseModel):
    flagged: bool
    reasons: list[str] = Field(default_factory=list)
    # Echoes the input length only (never the text) so logs stay clean.
    text_length: int = 0


# ── Health ───────────────────────────────────────────────────────────────────
class Health(BaseModel):
    status: Literal["ok"]
    service: str
    db_connected: bool
    version: str
