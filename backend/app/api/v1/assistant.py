import time
from typing import Dict, List
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.models.entities import User
from backend.app.schemas.dto import AssistantQueryRequest, AssistantQueryResponse
from backend.app.services.assistant_service import assistant_service
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/assistant", tags=["Evidence-Grounded AI Assistant"])

# In-memory sliding window rate limiter: user_id -> list of timestamps
_user_request_timestamps: Dict[str, List[float]] = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 30

def check_rate_limit(user_id: str):
    """Enforce server-side rate limiting per user (30 requests/minute)."""
    now = time.time()
    timestamps = _user_request_timestamps[user_id]
    # Prune old timestamps
    _user_request_timestamps[user_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(_user_request_timestamps[user_id]) >= MAX_REQUESTS_PER_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded (maximum 30 queries per minute). Please wait a moment before sending another request."
        )
    _user_request_timestamps[user_id].append(now)

@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(
    req: AssistantQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Evidence-grounded conversational travel risk intelligence query.
    Extracts relevant hazards, cites source timestamps and authorities,
    integrates Groq LLM with full RAG knowledge grounding, and enforces
    strict safety guardrails without fabricating safety assurances.
    """
    clean_query = req.query.strip()
    if not clean_query or len(clean_query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must contain at least 2 characters of meaningful text."
        )

    # Server-side rate limiting
    check_rate_limit(current_user.id)

    try:
        return await assistant_service.answer_query(
            query=clean_query,
            db=db,
            current_user=current_user,
            route_id=req.route_id,
            lat=req.latitude,
            lon=req.longitude,
            history=req.history
        )
    except HTTPException:
        raise
    except Exception as exc:
        # Never leak secrets or raw internal traces
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The travel intelligence assistant encountered a processing issue. Please retry in a moment."
        )
