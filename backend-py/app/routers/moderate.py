"""POST /api/v1/chat/moderate — flags risky Café Lounge chat text.

Stateless: takes text, returns {flagged, reasons}. No DB needed, so this
endpoint works even with ``db_unavailable``. See services/moderation.py for
the (deliberately transparent, non-ML) pattern set.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models import ModerateRequest, ModerateResponse
from app.security import require_api_key
from app.services.moderation import moderate as run_moderation

router = APIRouter(prefix="/chat", tags=["moderation"])


@router.post("/moderate", response_model=ModerateResponse, dependencies=[Depends(require_api_key)])
async def moderate(payload: ModerateRequest) -> ModerateResponse:
    flagged, reasons = run_moderation(payload.text)
    return ModerateResponse(flagged=flagged, reasons=reasons, text_length=len(payload.text or ""))
