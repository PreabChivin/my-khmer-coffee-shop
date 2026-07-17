"""API-key gatekeeping.

Every /api/v1/* route depends on `require_api_key`, so the Python analytics
pipeline is only reachable by a caller that knows the shared secret — in
practice, our own server-side Next.js bridge. A public request from a browser
or an attacker never has the header and is rejected 401 before any DB work.
"""

from __future__ import annotations

import hmac

from fastapi import Header, HTTPException, status

from app.config import get_settings

_API_KEY_HEADER = "X-Internal-Api-Key"


async def require_api_key(
    x_internal_api_key: str | None = Header(default=None, alias=_API_KEY_HEADER),
) -> None:
    secret = get_settings().api_secret
    # Constant-time compare so the check doesn't leak the secret via timing.
    if not x_internal_api_key or not hmac.compare_digest(x_internal_api_key, secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid internal API key.",
        )
