"""BENCHIMIN CAFE — AI & Analytics microservice (FastAPI).

A decoupled Python sidecar to the Next.js app. It reads the SAME Postgres the
Prisma app uses (read-only analytics/recommendation queries; it never writes,
never touches POS/transaction rows) and exposes three internal endpoints under
/api/v1, each guarded by a shared-secret header.

This process is intentionally NOT part of the Vercel/Next.js deployment — run
it locally (uvicorn) or host it separately (Fly.io / Render / a container).
The Next.js bridge routes fall back gracefully when it isn't reachable, so the
main app never depends on it being up.

Run (hot reload):  uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import connect, db_available, disconnect
from app.models import Health
from app.routers import analytics, moderate, recommend
from app.security import require_api_key

logging.basicConfig(level=logging.INFO)

VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: open the pool (non-fatal if the DB is unreachable).
    await connect()
    yield
    # Shutdown: close it cleanly.
    await disconnect()


app = FastAPI(
    title="BENCHIMIN CAFE — AI & Analytics Service",
    version=VERSION,
    description="Decoupled Python sidecar for sales analytics, recommendations, and chat moderation.",
    lifespan=lifespan,
)

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# All feature routers live under /api/v1 and are each API-key gated internally.
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(recommend.router, prefix="/api/v1")
app.include_router(moderate.router, prefix="/api/v1")


@app.get("/health", response_model=Health, tags=["meta"])
async def health() -> Health:
    """Public, unauthenticated liveness probe (no secrets, no data)."""
    return Health(status="ok", service="benchimin-ai", db_connected=db_available(), version=VERSION)


@app.get("/api/v1/whoami", tags=["meta"], dependencies=[Depends(require_api_key)])
async def whoami() -> dict[str, str]:
    """Authenticated ping — proves the shared-secret handshake end to end."""
    return {"caller": "authorized-internal-bridge"}
