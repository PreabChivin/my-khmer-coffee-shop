"""asyncpg connection-pool lifecycle + a graceful "is the DB reachable?" guard.

The pool is created on app startup and closed on shutdown (see main.lifespan).
Crucially, a failure to connect at startup is NOT fatal: the service still
boots and its endpoints return a clear ``db_unavailable`` signal instead of
500-ing. That keeps the microservice independently deployable/testable even
when the (Sensitive, Vercel-managed) Postgres creds aren't present in the
current environment.
"""

from __future__ import annotations

import logging
from typing import Optional

import asyncpg

from app.config import get_settings

logger = logging.getLogger("benchimin.ai.db")

_pool: Optional[asyncpg.Pool] = None


async def connect() -> None:
    """Create the shared pool. Never raises — logs and leaves _pool None on
    failure so the process stays up."""
    global _pool
    settings = get_settings()
    if not settings.database_url:
        logger.warning("DATABASE_URL is empty — DB features disabled (db_unavailable).")
        return
    try:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=settings.db_pool_min,
            max_size=settings.db_pool_max,
            timeout=10,
            command_timeout=15,
        )
        logger.info("Postgres pool ready.")
    except Exception as exc:  # noqa: BLE001 — deliberately broad; must not crash boot
        _pool = None
        logger.warning("Could not connect to Postgres (%s) — running db_unavailable.", exc)


async def disconnect() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool


def db_available() -> bool:
    return _pool is not None
