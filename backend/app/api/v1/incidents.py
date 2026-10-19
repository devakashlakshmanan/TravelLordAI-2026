import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.core.database import get_db
from backend.app.models.entities import Incident
from backend.app.schemas.dto import IncidentDTO, ThreatSummaryResponse

router = APIRouter(tags=["Incidents & Threat Intelligence"])

@router.get("/incidents", response_model=List[IncidentDTO])
async def list_incidents(
    category: Optional[str] = Query(None, description="Filter by hazard category"),
    severity: Optional[str] = Query(None, description="Filter by platform severity"),
    verification: Optional[str] = Query(None, description="Filter by verification status"),
    state: Optional[str] = Query(None, description="Filter by State or Union Territory name"),
    search: Optional[str] = Query(None, description="Keyword search across title and description"),
    min_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Bounding box minimum latitude"),
    max_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Bounding box maximum latitude"),
    min_lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Bounding box minimum longitude"),
    max_lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Bounding box maximum longitude"),
    include_sample: bool = Query(True, description="Include QA sample data with explicit badge"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of incidents to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve active travel hazards with multi-attribute filtering,
    spatial bounding-box (viewport) queries, and regional filters across India.
    """
    from sqlalchemy import or_

    stmt = select(Incident).where(Incident.status == "active")

    if category and category != "all":
        stmt = stmt.where(Incident.hazard_category == category)
    if severity and severity != "all":
        stmt = stmt.where(Incident.platform_severity == severity)
    if verification and verification != "all":
        stmt = stmt.where(Incident.verification_status == verification)
    if not include_sample:
        stmt = stmt.where(Incident.is_sample_data == False)

    # Viewport bounding box filtering
    if min_lat is not None and max_lat is not None:
        stmt = stmt.where(Incident.latitude >= min_lat, Incident.latitude <= max_lat)
    if min_lon is not None and max_lon is not None:
        stmt = stmt.where(Incident.longitude >= min_lon, Incident.longitude <= max_lon)

    # State / Region text filter
    if state and state.strip() and state != "all":
        stmt = stmt.where(
            or_(
                Incident.title.ilike(f"%{state.strip()}%"),
                Incident.description.ilike(f"%{state.strip()}%")
            )
        )

    # Keyword search
    if search and search.strip():
        q = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Incident.title.ilike(q),
                Incident.description.ilike(q),
                Incident.source_name.ilike(q)
            )
        )

    stmt = stmt.order_by(Incident.published_time.desc()).limit(limit)
    res = await db.execute(stmt)
    incidents = res.scalars().all()
    return [IncidentDTO.model_validate(inc) for inc in incidents]

@router.get("/incidents/{id}", response_model=IncidentDTO)
async def get_incident_details(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch individual incident with detailed attribution and evidence provenance."""
    res = await db.execute(select(Incident).where(Incident.id == id))
    inc = res.scalars().first()
    if not inc:
        raise HTTPException(status_code=404, detail="Hazard incident not found")
    return IncidentDTO.model_validate(inc)

@router.get("/threats/summary", response_model=ThreatSummaryResponse)
async def get_threat_summary(db: AsyncSession = Depends(get_db)):
    """Summary of active multi-threat counts across India."""
    res = await db.execute(select(Incident).where(Incident.status == "active"))
    all_active = res.scalars().all()

    by_cat = {}
    by_sev = {}
    verified_cnt = 0
    community_cnt = 0
    sample_cnt = 0

    for inc in all_active:
        by_cat[inc.hazard_category] = by_cat.get(inc.hazard_category, 0) + 1
        by_sev[inc.platform_severity] = by_sev.get(inc.platform_severity, 0) + 1
        if inc.verification_status == "official":
            verified_cnt += 1
        elif "community" in inc.verification_status:
            community_cnt += 1
        if inc.is_sample_data:
            sample_cnt += 1

    return ThreatSummaryResponse(
        total_active=len(all_active),
        by_category=by_cat,
        by_severity=by_sev,
        verified_count=verified_cnt,
        community_count=community_cnt,
        sample_data_count=sample_cnt,
        last_updated=datetime.datetime.now(datetime.timezone.utc)
    )

@router.get("/alerts", response_model=List[IncidentDTO])
async def get_high_priority_alerts(db: AsyncSession = Depends(get_db)):
    """Retrieve high-priority official alerts (Red/Orange IMD warnings, active blockages)."""
    stmt = (
        select(Incident)
        .where(
            Incident.status == "active",
            Incident.platform_severity.in_(["high", "critical"]),
            Incident.verification_status == "official"
        )
        .order_by(Incident.published_time.desc())
        .limit(10)
    )
    res = await db.execute(stmt)
    alerts = res.scalars().all()
    return [IncidentDTO.model_validate(a) for a in alerts]
