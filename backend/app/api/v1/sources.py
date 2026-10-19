from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.entities import Source

router = APIRouter(prefix="/sources", tags=["Data Sources & Transparency"])

@router.get("/status")
async def get_sources_status(db: AsyncSession = Depends(get_db)):
    """
    Public data transparency endpoint exposing source provenance, licensing,
    and ingestion freshness timestamps for TravelLord AI feeds.
    """
    res = await db.execute(select(Source))
    sources = res.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "official_url": s.official_url,
            "licensing_notes": s.licensing_notes,
            "adapter_type": s.adapter_type,
            "refresh_policy": s.refresh_policy,
            "last_successful_retrieval": s.last_successful_retrieval,
            "last_observed_update": s.last_observed_update,
            "health_status": s.health_status
        }
        for s in sources
    ]
