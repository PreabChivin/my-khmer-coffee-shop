"""Runtime configuration for the BENCHIMIN CAFE AI & Analytics microservice.

Reads everything from the environment (12-factor). Nothing here is
BENCHIMIN-specific business logic — it's just where the process learns how to
reach Postgres and what shared secret the Next.js bridge must present.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # 🔌 Postgres — the SAME database the Next.js/Prisma app uses. We read the
    # NON-POOLING url because this is a separate long-lived process managing its
    # own asyncpg pool; going through Prisma's PgBouncer pooler as well would
    # double-pool. Left empty by default so the service still BOOTS with no DB
    # configured (endpoints then report db_unavailable instead of crashing) —
    # important for local scaffolding before real creds are wired in.
    database_url: str = ""

    # 🔐 Shared secret the Next.js bridge sends in the X-Internal-Api-Key header.
    # Requests without the exact value are rejected 401 — so the analytics
    # pipeline is never reachable by a public/malicious caller, only by our own
    # server-side bridge that knows the secret. MUST be overridden in any real
    # deployment (the default is deliberately an obvious placeholder).
    api_secret: str = "change-me-in-production"

    # CORS origins allowed to call this service directly (mostly for local
    # Swagger/testing — the real caller is the server-side Next.js bridge, which
    # is not subject to browser CORS).
    allowed_origins: str = "http://localhost:3000"

    # asyncpg pool sizing.
    db_pool_min: int = 1
    db_pool_max: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
