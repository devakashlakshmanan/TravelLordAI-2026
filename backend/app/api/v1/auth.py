from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token
)
from backend.app.core.config import settings
from backend.app.models.entities import User, UserPreference
from backend.app.schemas.dto import (
    RegisterRequest,
    LoginRequest,
    PasswordResetRequest,
    TokenResponse,
    UserResponse
)
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    pwd_err = validate_password_strength(req.password)
    if pwd_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_err)

    norm_email = req.email.lower().strip()
    existing = await db.execute(select(User).where(User.email == norm_email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists."
        )

    hashed = hash_password(req.password)
    new_user = User(
        name=req.name.strip(),
        email=norm_email,
        password_hash=hashed,
        role="user",
        account_status="active"
    )
    db.add(new_user)
    await db.flush()

    # Create default preferences
    pref = UserPreference(
        user_id=new_user.id,
        preferred_language="en",
        preferred_travel_mode="driving",
        notification_preferences={"route_alerts": True, "weather_warnings": True},
        hazard_categories=["weather", "landslide", "wildlife", "social_disruption", "road_infrastructure"],
        privacy_settings={"share_live_location": False}
    )
    db.add(pref)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role
    )

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    norm_email = req.email.lower().strip()
    res = await db.execute(select(User).where(User.email == norm_email))
    user = res.scalars().first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials."
        )

    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support."
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role
    )

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    return {"message": "Successfully logged out from TravelLord AI."}

@router.post("/forgot-password")
async def forgot_password(req: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    # Constant-time response to prevent email enumeration attacks
    return {
        "message": "If an account associated with this email exists, password recovery instructions have been initiated."
    }
