import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from backend.app.core.database import get_db
from backend.app.models.entities import CommunityReport, Incident, User, IncidentEvidence
from backend.app.schemas.dto import (
    CommunityReportCreate,
    CommunityReportDTO,
    CorroborationRequest,
    DisputeRequest
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.spatial_service import haversine_distance_meters

router = APIRouter(prefix="/reports", tags=["Community Reporting & Shared Lifecycle"])

def _to_dto(r: CommunityReport) -> CommunityReportDTO:
    corroborations = len(r.corroborator_ids) if r.corroborator_ids else 0
    disputes = len(r.dispute_records) if r.dispute_records else 0
    return CommunityReportDTO(
        id=r.id,
        incident_id=r.incident_id,
        title=r.title or f"Community Report: {r.category.replace('_', ' ').title()}",
        category=r.category,
        description=r.description,
        latitude=r.latitude,
        longitude=r.longitude,
        location_name=r.location_name,
        observation_time=r.observation_time,
        media_url=r.media_url,
        moderation_state=r.moderation_state,
        moderation_notes=r.moderation_notes,
        rejection_reason=r.rejection_reason,
        corroborations_count=corroborations,
        disputes_count=disputes,
        created_at=r.created_at
    )

@router.post("", response_model=CommunityReportDTO, status_code=status.HTTP_201_CREATED)
async def submit_community_hazard(
    req: CommunityReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a citizen hazard report. Enforces:
    - Input validation and duplicate detection within 1.5 km
    - Automatic creation of a single shared Incident record
    - Default state: 'unverified'
    - Prevents self-promotion to 'officially_confirmed'
    """
    obs_time = req.observation_time or datetime.datetime.now(datetime.timezone.utc)
    title_text = req.title.strip() if req.title else f"Citizen Report: {req.category.replace('_', ' ').title()}"

    # Duplicate detection: check if active report in same category exists within 1500m
    rec_res = await db.execute(
        select(CommunityReport).where(
            CommunityReport.category == req.category,
            CommunityReport.moderation_state.in_(["unverified", "corroborated", "pending_review", "officially_confirmed"])
        )
    )
    existing_reports = rec_res.scalars().all()
    duplicate_found = None
    for rep in existing_reports:
        dist = haversine_distance_meters(req.latitude, req.longitude, rep.latitude, rep.longitude)
        if dist <= 1500.0:
            duplicate_found = rep
            break

    if duplicate_found:
        # If duplicate exists and was reported by another user, automatically record corroboration
        if duplicate_found.reporter_id != current_user.id:
            c_ids = list(duplicate_found.corroborator_ids or [])
            if current_user.id not in c_ids:
                c_ids.append(current_user.id)
                duplicate_found.corroborator_ids = c_ids
                duplicate_found.moderation_state = "corroborated"
                # Update linked incident
                if duplicate_found.incident_id:
                    inc_res = await db.execute(select(Incident).where(Incident.id == duplicate_found.incident_id))
                    linked_inc = inc_res.scalars().first()
                    if linked_inc:
                        linked_inc.verification_status = "verified_community"
                        linked_inc.evidence_quality = "high"
        await db.commit()
        await db.refresh(duplicate_found)
        return _to_dto(duplicate_found)

    # Create shared Incident record
    shared_incident = Incident(
        hazard_category=req.category,
        title=title_text,
        description=req.description.strip(),
        latitude=req.latitude,
        longitude=req.longitude,
        affected_radius_meters=3000.0,
        observed_time=obs_time,
        published_time=obs_time,
        source_name="TravelLord Citizen Community",
        source_url=None,
        source_severity="Community Observed",
        platform_severity="moderate",
        verification_status="unverified",
        status="active",
        is_sample_data=False,
        evidence_quality="moderate",
        fuzzed_coordinates=False,
        expiry_time=obs_time + datetime.timedelta(hours=24)
    )
    db.add(shared_incident)
    await db.flush()

    # Create CommunityReport
    new_report = CommunityReport(
        reporter_id=current_user.id,
        incident_id=shared_incident.id,
        title=title_text,
        category=req.category,
        description=req.description.strip(),
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=req.location_name or f"Pin at {round(req.latitude, 4)}, {round(req.longitude, 4)}",
        observation_time=obs_time,
        media_url=req.media_url,
        moderation_state="unverified",
        corroborator_ids=[],
        dispute_records=[]
    )
    db.add(new_report)

    # Add evidence record
    evidence = IncidentEvidence(
        incident_id=shared_incident.id,
        evidence_type="citizen_report",
        reference_id=new_report.id,
        confidence=0.6,
        notes="Initial citizen submission awaiting corroboration"
    )
    db.add(evidence)

    await db.commit()
    await db.refresh(new_report)
    return _to_dto(new_report)

@router.get("/feed", response_model=List[CommunityReportDTO])
async def list_community_feed(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Shared community incident feed accessible across all authenticated travelers.
    Returns unverified, corroborated, and officially confirmed citizen observations.
    Excludes rejected reports.
    """
    stmt = select(CommunityReport).where(CommunityReport.moderation_state != "rejected")

    if category and category != "all":
        stmt = stmt.where(CommunityReport.category == category)
    if status and status != "all":
        stmt = stmt.where(CommunityReport.moderation_state == status)
    if search and search.strip():
        q = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                CommunityReport.title.ilike(q),
                CommunityReport.description.ilike(q),
                CommunityReport.location_name.ilike(q)
            )
        )

    stmt = stmt.order_by(desc(CommunityReport.created_at)).limit(limit)
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [_to_dto(r) for r in reports]

@router.get("/mine", response_model=List[CommunityReportDTO])
async def list_my_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve private hazard report contribution history for the signed-in user."""
    res = await db.execute(
        select(CommunityReport)
        .where(CommunityReport.reporter_id == current_user.id)
        .order_by(desc(CommunityReport.created_at))
    )
    reports = res.scalars().all()
    return [_to_dto(r) for r in reports]

@router.get("/{id}", response_model=CommunityReportDTO)
async def get_report_status(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch status and moderation lifecycle of a report."""
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Hazard report not found")
    return _to_dto(report)

@router.post("/{id}/corroborate", response_model=CommunityReportDTO)
async def corroborate_report(
    id: str,
    body: CorroborationRequest = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Independent traveler corroboration of an active report.
    - Prevents the reporting user from corroborating their own submission.
    - Transitions report to 'corroborated' state.
    - Promotes linked Incident verification tier.
    """
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Hazard report not found")

    if report.reporter_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot corroborate your own report.")

    c_ids = list(report.corroborator_ids or [])
    if current_user.id in c_ids:
        raise HTTPException(status_code=400, detail="You have already corroborated this report.")

    c_ids.append(current_user.id)
    report.corroborator_ids = c_ids
    report.moderation_state = "corroborated"

    # Update linked incident
    if report.incident_id:
        inc_res = await db.execute(select(Incident).where(Incident.id == report.incident_id))
        linked_inc = inc_res.scalars().first()
        if linked_inc:
            linked_inc.verification_status = "verified_community"
            linked_inc.evidence_quality = "high"

    await db.commit()
    await db.refresh(report)
    return _to_dto(report)

@router.post("/{id}/dispute", response_model=CommunityReportDTO)
async def dispute_report(
    id: str,
    req: DisputeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Flag an inaccurate or cleared road condition as disputed.
    Records dispute metadata and marks moderation state as 'disputed'.
    """
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Hazard report not found")

    disputes = list(report.dispute_records or [])
    disputes.append({
        "user_id": current_user.id,
        "reason": req.reason,
        "notes": req.notes,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    })
    report.dispute_records = disputes
    report.moderation_state = "disputed"

    if report.incident_id:
        inc_res = await db.execute(select(Incident).where(Incident.id == report.incident_id))
        linked_inc = inc_res.scalars().first()
        if linked_inc:
            linked_inc.status = "disputed"

    await db.commit()
    await db.refresh(report)
    return _to_dto(report)

@router.post("/{id}/resolve", response_model=CommunityReportDTO)
async def resolve_report(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a hazard as resolved (e.g. fallen tree cleared, water drained).
    Allowed by the original reporter or a platform administrator.
    """
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Hazard report not found")

    if report.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the reporter or an administrator can resolve this report.")

    report.moderation_state = "resolved"

    if report.incident_id:
        inc_res = await db.execute(select(Incident).where(Incident.id == report.incident_id))
        linked_inc = inc_res.scalars().first()
        if linked_inc:
            linked_inc.status = "resolved"

    await db.commit()
    await db.refresh(report)
    return _to_dto(report)
