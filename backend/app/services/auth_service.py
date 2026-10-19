from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import (
    decode_access_token,
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token
)
from backend.app.core.config import settings
from backend.app.models.entities import User, UserPreference

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user_optional(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    # Check Bearer token first, then fallback to HttpOnly session cookie
    auth_token = token
    if not auth_token:
        auth_token = request.cookies.get(settings.SESSION_COOKIE_NAME)

    if not auth_token:
        return None

    payload = decode_access_token(auth_token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    query = select(User).where(User.id == user_id, User.account_status == "active")
    result = await db.execute(query)
    user = result.scalars().first()
    return user

async def get_current_user(
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this resource",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user

async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges are required for this action"
        )
    return current_user
