import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.entities import CommunityReport, Incident, Source, AdminAuditLog, User
from backend.app.schemas.dto import (
    CommunityReportDTO,
    ModerationActionRequest,
    IncidentDTO
)
from backend.app.services.auth_service import get_current_admin

router = APIRouter(prefix="/admin", tags=["Platform Administration & Moderation"])

@router.get("/reports", response_model=List[CommunityReportDTO])
async def list_reports_for_moderation(
    state: Optional[str] = Query(None, description="Filter by moderation state"),
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve community hazard reports requiring review."""
    stmt = select(CommunityReport)
    if state:
        stmt = stmt.where(CommunityReport.moderation_state == state)
    stmt = stmt.order_by(CommunityReport.created_at.desc())
    res = await db.execute(stmt)
    reports = res.scalars().all()
    return [CommunityReportDTO.model_validate(r) for r in reports]

@router.patch("/reports/{id}", response_model=CommunityReportDTO)
async def moderate_report(
    id: str,
    req: ModerationActionRequest,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve, corroborate, reject or resolve a community hazard submission."""
    res = await db.execute(select(CommunityReport).where(CommunityReport.id == id))
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Community report not found")

    old_state = report.moderation_state
    if req.action == "approve":
        report.moderation_state = "officially_confirmed"
        # Convert to active incident
        new_inc = Incident(
            hazard_category=report.category,
            title=f"Verified: {report.description[:60]}...",
            description=report.description,
            latitude=report.latitude,
            longitude=report.longitude,
            affected_radius_meters=5000.0,
            observed_time=report.observation_time,
            published_time=datetime.datetime.now(datetime.timezone.utc),
            source_name="TravelLord Moderated Community",
            source_severity="Verified Community Advisory",
            platform_severity="moderate",
            verification_status="verified_community",
            status="active",
            is_sample_data=False,
            evidence_quality="high",
            fuzzed_coordinates=False
        )
        db.add(new_inc)
        await db.flush()
        report.incident_id = new_inc.id

    elif req.action == "corroborate":
        report.moderation_state = "corroborated"
    elif req.action == "reject":
        report.moderation_state = "rejected"
        report.rejection_reason = req.rejection_reason or "Does not meet verification standards."
    elif req.action == "resolve":
        report.moderation_state = "resolved"

    report.moderation_notes = req.moderation_notes

    # Create immutable audit log
    audit = AdminAuditLog(
        admin_id=admin_user.id,
        admin_email=admin_user.email,
        action=f"MODERATE_REPORT_{req.action.upper()}",
        target_entity="community_report",
        target_id=report.id,
        change_metadata={"old_state": old_state, "new_state": report.moderation_state, "reason": req.rejection_reason},
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(report)
    return CommunityReportDTO.model_validate(report)

@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = 50,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """View administrative audit trail."""
    res = await db.execute(
        select(AdminAuditLog).order_by(AdminAuditLog.timestamp.desc()).limit(limit)
    )
    logs = res.scalars().all()
    return [
        {
            "id": l.id,
            "admin_email": l.admin_email,
            "action": l.action,
            "target_entity": l.target_entity,
            "target_id": l.target_id,
            "change_metadata": l.change_metadata,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp
        }
        for l in logs
    ]

@router.get("/sources")
async def list_admin_sources(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """View data ingestion adapter health and freshness stats."""
    res = await db.execute(select(Source))
    sources = res.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "official_url": s.official_url,
            "adapter_type": s.adapter_type,
            "refresh_policy": s.refresh_policy,
            "last_successful_retrieval": s.last_successful_retrieval,
            "health_status": s.health_status,
            "consecutive_failures": s.consecutive_failures
        }
        for s in sources
    ]
