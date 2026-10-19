from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.entities import Notification, User
from backend.app.schemas.dto import NotificationDTO
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/notifications", tags=["User Notifications"])

@router.get("", response_model=List[NotificationDTO])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve notifications for the authenticated user."""
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    items = res.scalars().all()
    return [NotificationDTO.model_validate(n) for n in items]

@router.patch("/{id}", response_model=NotificationDTO)
async def mark_notification_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read."""
    res = await db.execute(
        select(Notification).where(Notification.id == id, Notification.user_id == current_user.id)
    )
    notif = res.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return NotificationDTO.model_validate(notif)
