from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.models.entities import User, UserPreference
from backend.app.schemas.dto import UserResponse, UserUpdateRequest
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(User).options(selectinload(User.preferences)).where(User.id == current_user.id)
    )
    user = res.scalars().first()
    pref_dict = {}
    if user.preferences:
        pref_dict = {
            "preferred_language": user.preferences.preferred_language,
            "preferred_travel_mode": user.preferences.preferred_travel_mode,
            "notification_preferences": user.preferences.notification_preferences,
            "hazard_categories": user.preferences.hazard_categories,
            "privacy_settings": user.preferences.privacy_settings,
        }

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        account_status=user.account_status,
        created_at=user.created_at,
        preferences=pref_dict
    )

@router.patch("/me", response_model=UserResponse)
async def update_user_profile(
    req: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(User).options(selectinload(User.preferences)).where(User.id == current_user.id)
    )
    user = res.scalars().first()

    if req.name:
        user.name = req.name.strip()

    if user.preferences:
        pref = user.preferences
        if req.preferred_language:
            pref.preferred_language = req.preferred_language
        if req.preferred_travel_mode:
            pref.preferred_travel_mode = req.preferred_travel_mode
        if req.notification_preferences is not None:
            pref.notification_preferences = req.notification_preferences
        if req.hazard_categories is not None:
            pref.hazard_categories = req.hazard_categories
        if req.privacy_settings is not None:
            pref.privacy_settings = req.privacy_settings

    await db.commit()
    await db.refresh(user)

    pref_dict = {}
    if user.preferences:
        pref_dict = {
            "preferred_language": user.preferences.preferred_language,
            "preferred_travel_mode": user.preferences.preferred_travel_mode,
            "notification_preferences": user.preferences.notification_preferences,
            "hazard_categories": user.preferences.hazard_categories,
            "privacy_settings": user.preferences.privacy_settings,
        }

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        account_status=user.account_status,
        created_at=user.created_at,
        preferences=pref_dict
    )
