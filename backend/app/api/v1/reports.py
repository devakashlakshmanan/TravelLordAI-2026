import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.entities import CommunityReport, Incident, User
from backend.app.schemas.dto import CommunityReportCreate, CommunityReportDTO
from backend.app.services.auth_service import get_current_user, get_current_user_optional

router = APIRouter(prefix="/reports", tags=["Community Reporting"])

@router.post("", response_model=CommunityReportDTO, status_code=status.HTTP_201_CREATED)
async def submit_community_hazard(
    req: CommunityReportCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a citizen hazard report. All new reports enter 'pending_review' state.
    Users cannot self-promote reports to 'officially_confirmed'.
    """
    obs_time = req.observation_time or datetime.datetime.now(datetime.timezone.utc)
    new_report = CommunityReport(
        reporter_id=current_user.id if current_user else None,
        category=req.category,
        description=req.description.strip(),
        latitude=req.latitude,
        longitude=req.longitude,
        location_name=req.location_name or f"Pin at {round(req.latitude, 4)}, {round(req.longitude, 4)}",
        observation_time=obs_time,
        media_url=req.media_url,
        moderation_state="pending_review"
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    return CommunityReportDTO.model_validate(new_report)

@router.get("/mine", response_model=List[CommunityReportDTO])
async def list_my_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve hazard reports submitted by the authenticated user."""
    res = await db.execute(
        select(CommunityReport)
        .where(CommunityReport.reporter_id == current_user.id)
        .order_by(CommunityReport.created_at.desc())
    )
    reports = res.scalars().all()
    return [CommunityReportDTO.model_validate(r) for r in reports]

@router.get("/{id}", response_model=CommunityReportDTO)
async def get_report_status(id: str, db: AsyncSession = Depends(get_db)):
    """Fetch status and moderation lifecycle of a report."""
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Hazard report not found")
    return CommunityReportDTO.model_validate(report)
